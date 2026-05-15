import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { HttpClientService } from './http-client/http-client.service';
import { TlsCheckerService } from './tls/tls-checker.service';
import { DnsCheckerService } from './dns/dns-checker.service';
import { SecurityFileCheckerService } from './files/security-file-checker.service';
import { SensitiveFileCheckerService } from './files/sensitive-file-checker.service';
import { SriCheckerService } from './content/sri-checker.service';
import { TechFingerprinterService } from './fingerprint/tech-fingerprinter.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ReportService } from '../report/report.service';
import type { ScanResult } from '../common/interfaces/scan-result.interface';
import type { ScanProgressEvent } from './dto/scan-progress.dto';

@Injectable()
export class ScannerService {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly tlsChecker: TlsCheckerService,
    private readonly dnsChecker: DnsCheckerService,
    private readonly securityFileChecker: SecurityFileCheckerService,
    private readonly sensitiveFileChecker: SensitiveFileCheckerService,
    private readonly sriChecker: SriCheckerService,
    private readonly techFingerprinter: TechFingerprinterService,
    private readonly analyzer: AnalyzerService,
    private readonly compliance: ComplianceService,
    private readonly report: ReportService,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
    const protocol = parsedUrl.protocol;
    const baseOrigin = `${protocol}//${hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;

    const [httpResult, tlsResult, dnsResult, securityFilesResult, sriResult, sensitiveFilesResult] = await Promise.all([
      this.httpClient.fetch(url),
      protocol === 'https:' ? this.tlsChecker.check(hostname, port) : Promise.resolve({
        checked: false, hostname, port,
        error: 'TLS check only applies to HTTPS URLs',
        tlsVersion: null, certificate: null, grade: 0,
      }),
      this.dnsChecker.check(hostname),
      this.securityFileChecker.check(baseOrigin),
      this.sriChecker.check(url),
      this.sensitiveFileChecker.check(baseOrigin),
    ]);

    const [analysisResult, fingerprintResult] = await Promise.all([
      this.analyzer.analyze(httpResult.headers),
      this.techFingerprinter.fingerprint(httpResult.headers, url),
    ]);

    const complianceResult = this.compliance.evaluate(
      analysisResult.headers,
      tlsResult,
      dnsResult,
      securityFilesResult,
      fingerprintResult,
    );

    return this.report.generate({
      url,
      headers: analysisResult,
      compliance: complianceResult,
      metadata: {
        responseTime: httpResult.responseTime,
        statusCode: httpResult.statusCode,
        analyzedAt: new Date().toISOString(),
      },
      tls: tlsResult,
      dns: dnsResult,
      securityFiles: securityFilesResult,
      sri: sriResult,
      sensitiveFiles: sensitiveFilesResult,
      fingerprint: fingerprintResult,
    });
  }

  /**
   * Scan with progressive SSE events.
   * Each subsystem emits a progress event as it completes.
   */
  scanStream(url: string): Observable<ScanProgressEvent | ScanResult> {
    const subject = new Subject<ScanProgressEvent | ScanResult>();

    this.runScanWithProgress(url, subject).catch((err) => {
      subject.error(err);
    });

    return subject.asObservable();
  }

  private emit(subject: Subject<ScanProgressEvent | ScanResult>, event: ScanProgressEvent) {
    subject.next(event);
  }

  private async runScanWithProgress(
    url: string,
    subject: Subject<ScanProgressEvent | ScanResult>,
  ): Promise<void> {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
    const protocol = parsedUrl.protocol;
    const baseOrigin = `${protocol}//${hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;

    // Stage 1: HTTP + TLS + DNS + files — all in parallel, each emits on completion
    this.emit(subject, { stage: 'http', status: 'scanning', message: 'Solicitando headers HTTP...' });
    const httpPromise = this.httpClient.fetch(url).then((r) => {
      this.emit(subject, { stage: 'http', status: 'complete' });
      return r;
    });

    this.emit(subject, { stage: 'tls', status: 'scanning', message: 'Verificando conexión TLS...' });
    const tlsPromise = protocol === 'https:'
      ? this.tlsChecker.check(hostname, port).then((r) => {
          this.emit(subject, { stage: 'tls', status: 'complete' });
          return r;
        })
      : Promise.resolve({
          checked: false, hostname, port,
          error: 'TLS check only applies to HTTPS URLs',
          tlsVersion: null, certificate: null, grade: 0,
        } as any).then((r) => {
          this.emit(subject, { stage: 'tls', status: 'complete' });
          return r;
        });

    this.emit(subject, { stage: 'dns', status: 'scanning', message: 'Consultando registros DNS...' });
    const dnsPromise = this.dnsChecker.check(hostname).then((r) => {
      this.emit(subject, { stage: 'dns', status: 'complete' });
      return r;
    });

    this.emit(subject, { stage: 'security-files', status: 'scanning', message: 'Buscando archivos de seguridad...' });
    const secFilesPromise = this.securityFileChecker.check(baseOrigin).then((r) => {
      this.emit(subject, { stage: 'security-files', status: 'complete' });
      return r;
    });

    this.emit(subject, { stage: 'sensitive-files', status: 'scanning', message: 'Escaneando archivos sensibles...' });
    const sensFilesPromise = this.sensitiveFileChecker.check(baseOrigin).then((r) => {
      this.emit(subject, { stage: 'sensitive-files', status: 'complete' });
      return r;
    });

    this.emit(subject, { stage: 'sri', status: 'scanning', message: 'Analizando integridad de recursos (SRI)...' });
    const sriPromise = this.sriChecker.check(url).then((r) => {
      this.emit(subject, { stage: 'sri', status: 'complete' });
      return r;
    });

    const httpResult = await httpPromise;

    this.emit(subject, { stage: 'fingerprint', status: 'scanning', message: 'Identificando tecnologías...' });
    const fpPromise = this.techFingerprinter.fingerprint(httpResult.headers, url).then((r) => {
      this.emit(subject, { stage: 'fingerprint', status: 'complete' });
      return r;
    });

    // Wait for ALL parallel checks to complete
    const [tlsResult, dnsResult, securityFilesResult, sriResult, sensitiveFilesResult, fingerprintResult] =
      await Promise.all([tlsPromise, dnsPromise, secFilesPromise, sriPromise, sensFilesPromise, fpPromise]);

    // Stage 2: Analysis + Compliance
    this.emit(subject, { stage: 'analysis', status: 'scanning', message: 'Analizando resultados...' });
    const analysisResult = await this.analyzer.analyze(httpResult.headers);

    const complianceResult = this.compliance.evaluate(
      analysisResult.headers,
      tlsResult,
      dnsResult,
      securityFilesResult,
      fingerprintResult,
    );

    this.emit(subject, { stage: 'analysis', status: 'complete' });

    const report = this.report.generate({
      url,
      headers: analysisResult,
      compliance: complianceResult,
      metadata: {
        responseTime: httpResult.responseTime,
        statusCode: httpResult.statusCode,
        analyzedAt: new Date().toISOString(),
      },
      tls: tlsResult,
      dns: dnsResult,
      securityFiles: securityFilesResult,
      sri: sriResult,
      sensitiveFiles: sensitiveFilesResult,
      fingerprint: fingerprintResult,
    });

    this.emit(subject, { stage: 'complete', status: 'complete', message: 'Escaneo completado' });
    subject.next(report);
    subject.complete();
  }
}

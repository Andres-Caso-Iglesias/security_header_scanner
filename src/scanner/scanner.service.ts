import { Injectable, Logger } from '@nestjs/common';
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
import { HistoryService } from '../history/history.service';
import type { ScanResult } from '../common/interfaces/scan-result.interface';
import type { ScanProgressEvent } from './dto/scan-progress.dto';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
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
    private readonly history: HistoryService,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const report = await this.scanCore(url);

    // Auto-save to history
    try {
      await this.history.save(url, report.score, report.grade, report.timestamp, report);
    } catch (e) {
      this.logger.warn(`Failed to save scan to history: ${(e as Error).message}`);
    }

    return report;
  }

  /**
   * Scan with progressive SSE events.
   * Each subsystem emits a progress event as it completes.
   */
  scanStream(url: string): Observable<ScanProgressEvent | ScanResult> {
    const subject = new Subject<ScanProgressEvent | ScanResult>();

    this.scanCore(url, (event) => subject.next(event))
      .then((report) => {
        subject.next(report);
        subject.complete();
      })
      .catch((err) => subject.error(err));

    return subject.asObservable();
  }

  /**
   * Core scan logic shared by scan() and scanStream().
   * When onProgress is provided, emits progress events between stages.
   */
  private async scanCore(
    url: string,
    onProgress?: (event: ScanProgressEvent) => void,
  ): Promise<ScanResult> {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
    const protocol = parsedUrl.protocol;
    const baseOrigin = `${protocol}//${hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;

    const emit = (stage: string, status: string, message?: string) => {
      if (onProgress) onProgress({ stage, status, message } as ScanProgressEvent);
    };

    // Stage 1: HTTP + TLS + DNS + files — all in parallel, each emits on completion
    emit('http', 'scanning', 'Solicitando headers HTTP...');
    const httpPromise = this.httpClient.fetch(url).then((r) => {
      emit('http', 'complete');
      return r;
    });

    emit('tls', 'scanning', 'Verificando conexión TLS...');
    const tlsPromise = protocol === 'https:'
      ? this.tlsChecker.check(hostname, port).then((r) => {
          emit('tls', 'complete');
          return r;
        })
      : Promise.resolve({
          checked: false, hostname, port,
          error: 'TLS check only applies to HTTPS URLs',
          tlsVersion: null, certificate: null, grade: 0,
        } as any).then((r) => {
          emit('tls', 'complete');
          return r;
        });

    emit('dns', 'scanning', 'Consultando registros DNS...');
    const dnsPromise = this.dnsChecker.check(hostname).then((r) => {
      emit('dns', 'complete');
      return r;
    });

    emit('security-files', 'scanning', 'Buscando archivos de seguridad...');
    const secFilesPromise = this.securityFileChecker.check(baseOrigin).then((r) => {
      emit('security-files', 'complete');
      return r;
    });

    emit('sensitive-files', 'scanning', 'Escaneando archivos sensibles...');
    const sensFilesPromise = this.sensitiveFileChecker.check(baseOrigin).then((r) => {
      emit('sensitive-files', 'complete');
      return r;
    });

    emit('sri', 'scanning', 'Analizando integridad de recursos (SRI)...');
    const sriPromise = this.sriChecker.check(url).then((r) => {
      emit('sri', 'complete');
      return r;
    });

    const httpResult = await httpPromise;

    emit('fingerprint', 'scanning', 'Identificando tecnologías...');
    const fpPromise = this.techFingerprinter.fingerprint(httpResult.headers, url).then((r) => {
      emit('fingerprint', 'complete');
      return r;
    });

    // Wait for ALL parallel checks to complete
    const [tlsResult, dnsResult, securityFilesResult, sriResult, sensitiveFilesResult, fingerprintResult] =
      await Promise.all([tlsPromise, dnsPromise, secFilesPromise, sriPromise, sensFilesPromise, fpPromise]);

    // Stage 2: Analysis + Compliance
    emit('analysis', 'scanning', 'Analizando resultados...');
    const analysisResult = await this.analyzer.analyze(httpResult.headers);

    const complianceResult = this.compliance.evaluate(
      analysisResult.headers,
      tlsResult,
      dnsResult,
      securityFilesResult,
      fingerprintResult,
    );

    emit('analysis', 'complete');

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

    emit('complete', 'complete', 'Escaneo completado');
    return report;
  }
}

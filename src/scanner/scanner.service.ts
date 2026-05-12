import { Injectable } from '@nestjs/common';
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

    // Run independent checks in parallel
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

    // Fingerprinting uses HTTP headers (already available) - run in parallel with analysis
    const [analysisResult, fingerprintResult] = await Promise.all([
      this.analyzer.analyze(httpResult.headers),
      this.techFingerprinter.fingerprint(httpResult.headers, url),
    ]);

    const complianceResult = this.compliance.evaluate(
      analysisResult.headers,
      tlsResult,
      dnsResult,
    );

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

    return report;
  }
}

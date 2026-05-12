import { Injectable } from '@nestjs/common';
import { HttpClientService } from './http-client/http-client.service';
import { TlsCheckerService } from './tls/tls-checker.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ReportService } from '../report/report.service';
import type { ScanResult } from '../common/interfaces/scan-result.interface';

@Injectable()
export class ScannerService {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly tlsChecker: TlsCheckerService,
    private readonly analyzer: AnalyzerService,
    private readonly compliance: ComplianceService,
    private readonly report: ReportService,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
    const protocol = parsedUrl.protocol;

    // Run HTTP fetch and TLS check in parallel
    const [httpResult, tlsResult] = await Promise.all([
      this.httpClient.fetch(url),
      protocol === 'https:' ? this.tlsChecker.check(hostname, port) : Promise.resolve({
        checked: false,
        hostname,
        port,
        error: 'TLS check only applies to HTTPS URLs',
        tlsVersion: null,
        certificate: null,
        grade: 0,
      }),
    ]);

    const analysisResult = this.analyzer.analyze(httpResult.headers);

    const complianceResult = this.compliance.evaluate(
      analysisResult.headers,
      tlsResult,
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
    });

    return report;
  }
}

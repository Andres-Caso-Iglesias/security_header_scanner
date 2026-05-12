import { Injectable } from '@nestjs/common';
import { HttpClientService } from './http-client/http-client.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ReportService } from '../report/report.service';
import { ScanResult } from '../common/interfaces/scan-result.interface';

@Injectable()
export class ScannerService {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly analyzer: AnalyzerService,
    private readonly compliance: ComplianceService,
    private readonly report: ReportService,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const httpResult = await this.httpClient.fetch(url);

    const analysisResult = this.analyzer.analyze(httpResult.headers);

    const complianceResult = this.compliance.evaluate(analysisResult.headers);

    const report = this.report.generate({
      url,
      headers: analysisResult,
      compliance: complianceResult,
      metadata: {
        responseTime: httpResult.responseTime,
        statusCode: httpResult.statusCode,
        analyzedAt: new Date().toISOString(),
      },
    });

    return report;
  }
}

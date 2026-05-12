import { HttpClientService } from './http-client/http-client.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ReportService } from '../report/report.service';
import { ScanResult } from '../common/interfaces/scan-result.interface';
export declare class ScannerService {
    private readonly httpClient;
    private readonly analyzer;
    private readonly compliance;
    private readonly report;
    constructor(httpClient: HttpClientService, analyzer: AnalyzerService, compliance: ComplianceService, report: ReportService);
    scan(url: string): Promise<ScanResult>;
}

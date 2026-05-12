import { HttpClientService } from './http-client/http-client.service';
import { TlsCheckerService } from './tls/tls-checker.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ReportService } from '../report/report.service';
import type { ScanResult } from '../common/interfaces/scan-result.interface';
export declare class ScannerService {
    private readonly httpClient;
    private readonly tlsChecker;
    private readonly analyzer;
    private readonly compliance;
    private readonly report;
    constructor(httpClient: HttpClientService, tlsChecker: TlsCheckerService, analyzer: AnalyzerService, compliance: ComplianceService, report: ReportService);
    scan(url: string): Promise<ScanResult>;
}

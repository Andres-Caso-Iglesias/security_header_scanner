import type { ScanResult } from '../common/interfaces/scan-result.interface';
import type { ReportInput } from './interfaces/report.interface';
export declare class ReportService {
    generate(input: ReportInput): ScanResult;
    private generateRecommendations;
}

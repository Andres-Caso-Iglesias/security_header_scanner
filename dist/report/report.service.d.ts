import { ScanResult } from '../common/interfaces/scan-result.interface';
import { ReportInput } from './interfaces/report.interface';
export declare class ReportService {
    generate(input: ReportInput): ScanResult;
    private generateRecommendations;
}

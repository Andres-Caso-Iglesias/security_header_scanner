import type { ScanResult } from '../../common/interfaces/scan-result.interface';
export declare class ExportService {
    generateJson(result: ScanResult): string;
    generatePdf(result: ScanResult): Promise<Buffer>;
}

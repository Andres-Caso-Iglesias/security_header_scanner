import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceSection, ScanMetadata } from '../../common/interfaces/scan-result.interface';
export declare class ScanResponseDto {
    url: string;
    timestamp: string;
    score: number;
    grade: string;
    headers: HeaderResult[];
    compliance: ComplianceSection[];
    recommendations: string[];
    metadata: ScanMetadata;
}

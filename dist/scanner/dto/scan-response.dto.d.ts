import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceSection, ScanMetadata } from '../../common/interfaces/scan-result.interface';
import { TlsInfo } from '../../common/interfaces/tls-info.interface';
import { DnsInfo } from '../../common/interfaces/dns-info.interface';
export declare class ScanResponseDto {
    url: string;
    timestamp: string;
    score: number;
    grade: string;
    headers: HeaderResult[];
    compliance: ComplianceSection[];
    recommendations: string[];
    metadata: ScanMetadata;
    tls: TlsInfo;
    dns: DnsInfo;
}

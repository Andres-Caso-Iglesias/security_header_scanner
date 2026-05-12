import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceSection, ScanMetadata } from '../../common/interfaces/scan-result.interface';
import { TlsInfo } from '../../common/interfaces/tls-info.interface';
import { DnsInfo } from '../../common/interfaces/dns-info.interface';
import { SecurityFileInfo } from '../../common/interfaces/security-file-info.interface';
import { SriInfo, SensitiveFilesInfo } from '../../common/interfaces/content-info.interface';
import { TechFingerprintInfo } from '../../common/interfaces/fingerprint-info.interface';
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
    securityFiles: SecurityFileInfo;
    sri: SriInfo;
    sensitiveFiles: SensitiveFilesInfo;
    fingerprint: TechFingerprintInfo;
}

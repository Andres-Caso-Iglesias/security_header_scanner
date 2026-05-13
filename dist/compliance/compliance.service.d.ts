import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../common/interfaces/dns-info.interface';
import type { SecurityFileInfo } from '../common/interfaces/security-file-info.interface';
import type { TechFingerprintInfo } from '../common/interfaces/fingerprint-info.interface';
import type { ComplianceSection } from '../common/interfaces/scan-result.interface';
export declare class ComplianceService {
    private readonly owaspMapper;
    private readonly nis2Mapper;
    private readonly ensMapper;
    private readonly iso27001Mapper;
    evaluate(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo, securityFiles?: SecurityFileInfo, fingerprint?: TechFingerprintInfo): ComplianceSection[];
}

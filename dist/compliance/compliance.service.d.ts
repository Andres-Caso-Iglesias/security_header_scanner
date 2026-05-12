import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../common/interfaces/dns-info.interface';
import type { ComplianceSection } from '../common/interfaces/scan-result.interface';
export declare class ComplianceService {
    private readonly owaspMapper;
    private readonly nis2Mapper;
    evaluate(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceSection[];
}

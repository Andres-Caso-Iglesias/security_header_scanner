import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { ComplianceFinding } from '../interfaces/compliance-finding.interface';
export declare class OwaspTop10Mapper {
    private readonly version;
    map(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceFinding[];
    private mapA01BrokenAccessControl;
    private mapA05SecurityMisconfiguration;
    private mapA06VulnerableComponents;
}

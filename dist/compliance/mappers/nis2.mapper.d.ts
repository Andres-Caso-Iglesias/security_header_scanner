import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { ComplianceFinding } from '../interfaces/compliance-finding.interface';
export declare class Nis2Mapper {
    private readonly version;
    map(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceFinding[];
    private mapArticle21cAccessControl;
    private mapArticle21dIncidentHandling;
    private mapArticle21gSupplyChain;
    private mapArticle21iCryptography;
}

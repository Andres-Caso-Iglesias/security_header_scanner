import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
export declare class DnsCheckerService {
    private readonly logger;
    private readonly timeoutMs;
    check(hostname: string): Promise<DnsInfo>;
    private checkSpf;
    private checkDkim;
    private checkDmarc;
    private resolveTxtWithTimeout;
    private emptyRecord;
}

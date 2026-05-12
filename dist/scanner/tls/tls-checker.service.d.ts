import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
export declare class TlsCheckerService {
    private readonly logger;
    private readonly timeoutMs;
    private readonly defaultPort;
    check(hostname: string, port?: number): Promise<TlsInfo>;
    private performTlsCheck;
    private parseCertificate;
    private calculateTlsGrade;
}

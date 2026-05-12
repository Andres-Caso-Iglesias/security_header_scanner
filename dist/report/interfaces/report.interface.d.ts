import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { ComplianceSection } from '../../common/interfaces/scan-result.interface';
export interface ReportInput {
    url: string;
    headers: {
        headers: HeaderResult[];
        score: number;
        grade: string;
    };
    compliance: ComplianceSection[];
    metadata: {
        responseTime: number;
        statusCode: number;
        analyzedAt: string;
    };
    tls: TlsInfo;
    dns: DnsInfo;
}

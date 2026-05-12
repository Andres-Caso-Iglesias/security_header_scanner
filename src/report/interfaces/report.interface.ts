import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { SecurityFileInfo } from '../../common/interfaces/security-file-info.interface';
import type { SriInfo, SensitiveFilesInfo } from '../../common/interfaces/content-info.interface';
import type { TechFingerprintInfo } from '../../common/interfaces/fingerprint-info.interface';
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
  securityFiles: SecurityFileInfo;
  sri: SriInfo;
  sensitiveFiles: SensitiveFilesInfo;
  fingerprint: TechFingerprintInfo;
}

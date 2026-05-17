// ============================================================================
// MIRROR: Keep in sync with backend interfaces in src/common/interfaces/
// Run `npm run sync-types` to update from backend (script TBD)
// ============================================================================

// --- from src/common/interfaces/header-checker.interface.ts ---
export type HeaderSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface HeaderResult {
  header: string;
  present: boolean;
  value: string | null;
  expected: string;
  grade: number;
  severity: HeaderSeverity;
  weight: number;
  finding: string;
  recommendation: string;
}

// --- from src/common/interfaces/scan-result.interface.ts ---
export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';

export interface ComplianceFinding {
  control: string;
  status: ComplianceStatus;
  relatedHeaders: string[];
  description: string;
  recommendation: string;
}

export interface ComplianceSection {
  framework: string;
  version: string;
  findings: ComplianceFinding[];
}

export interface ScanMetadata {
  responseTime: number;
  statusCode: number;
  analyzedAt: string;
}

export interface ScanResult {
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

// --- from src/common/interfaces/tls-info.interface.ts ---
export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  expiresInDays: number;
  expired: boolean;
  selfSigned: boolean;
  wildcard: boolean;
  fingerprint: string;
  serialNumber: string;
  san: string[];
}

export interface TlsInfo {
  checked: boolean;
  hostname: string;
  port: number;
  error: string | null;
  tlsVersion: string | null;
  certificate: CertificateInfo | null;
  grade: number;
}

// --- from src/common/interfaces/dns-info.interface.ts ---
export interface DnsRecord {
  type: string;
  value: string;
  present: boolean;
  grade: number;
  finding: string;
  recommendation: string;
}

export interface DnsInfo {
  hostname: string;
  checked: boolean;
  error: string | null;
  spf: DnsRecord;
  dkim: DnsRecord;
  dmarc: DnsRecord;
  grade: number;
}

// --- from src/common/interfaces/security-file-info.interface.ts ---
export interface SecurityFileCheck {
  path: string;
  present: boolean;
  statusCode: number | null;
  content: string | null;
  grade: number;
  finding: string;
  recommendation: string;
}

export interface SecurityFileInfo {
  checked: boolean;
  securityTxt: SecurityFileCheck;
  robotsTxt: SecurityFileCheck;
  grade: number;
}

// --- from src/common/interfaces/content-info.interface.ts ---
export interface SriResource {
  tag: string;
  src: string;
  hasIntegrity: boolean;
}

export interface SriInfo {
  checked: boolean;
  totalResources: number;
  secureResources: number;
  insecureResources: SriResource[];
  grade: number;
  finding: string;
  recommendation: string;
}

export interface SensitiveFileResult {
  path: string;
  statusCode: number | null;
  exposed: boolean;
  finding: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SensitiveFilesInfo {
  checked: boolean;
  files: SensitiveFileResult[];
  exposedCount: number;
  grade: number;
}

// --- from src/common/interfaces/fingerprint-info.interface.ts ---
export interface DetectedTech {
  name: string;
  version: string | null;
  category: 'cms' | 'framework' | 'server' | 'runtime' | 'cdn';
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface CveInfo {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedVersions: string;
}

export interface TechFingerprintInfo {
  checked: boolean;
  technologies: DetectedTech[];
  cves: CveInfo[];
  grade: number;
  summary: string;
}

// ============================================================================
// FRONTEND-ONLY TYPES (UI state, component props, utility constants)
// ============================================================================

export const GRADE_COLORS: Record<string, string> = {
  A: '#4ade80',
  B: '#a3e635',
  C: '#facc15',
  D: '#fb923c',
  E: '#f87171',
  F: '#dc2626',
} as const;

export const SEVERITY: Record<HeaderSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Critical' },
  high: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'High' },
  medium: { color: '#facc15', bg: 'rgba(250,204,21,0.12)', label: 'Medium' },
  low: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Low' },
} as const;

export const COMPLIANCE_COLORS: Record<ComplianceStatus, string> = {
  compliant: '#4ade80',
  partially_compliant: '#facc15',
  non_compliant: '#f87171',
  not_applicable: '#64748b',
} as const;

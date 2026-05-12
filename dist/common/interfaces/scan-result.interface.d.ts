import type { HeaderResult } from './header-checker.interface';
export interface ComplianceFinding {
    control: string;
    status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
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
}

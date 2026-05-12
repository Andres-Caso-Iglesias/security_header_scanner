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

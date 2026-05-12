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
export interface HeaderChecker {
    name: string;
    severity: HeaderSeverity;
    weight: number;
    analyze(value: string | undefined): HeaderResult;
}

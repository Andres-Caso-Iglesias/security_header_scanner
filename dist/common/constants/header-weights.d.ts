import type { HeaderSeverity } from '../interfaces/header-checker.interface';
export interface HeaderWeightConfig {
    name: string;
    headerName: string;
    severity: HeaderSeverity;
    weight: number;
    description: string;
    expectedValue: string;
}
export declare const HEADER_WEIGHTS: HeaderWeightConfig[];

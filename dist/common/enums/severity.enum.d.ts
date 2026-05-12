export declare const SEVERITY: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
};
export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];
export declare const SEVERITY_WEIGHTS: {
    readonly critical: 25;
    readonly high: 15;
    readonly medium: 10;
    readonly low: 5;
};

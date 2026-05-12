import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CspChecker implements HeaderChecker {
    readonly name = "CSP";
    readonly severity: "critical";
    readonly weight = 25;
    analyze(value: string | undefined): HeaderResult;
}

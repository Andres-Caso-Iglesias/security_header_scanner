import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class HstsChecker implements HeaderChecker {
    readonly name = "HSTS";
    readonly severity: "high";
    readonly weight = 15;
    analyze(value: string | undefined): HeaderResult;
}

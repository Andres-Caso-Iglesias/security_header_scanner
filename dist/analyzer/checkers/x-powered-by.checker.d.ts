import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class XPoweredByChecker implements HeaderChecker {
    readonly name = "X-Powered-By";
    readonly severity: "low";
    readonly weight = 5;
    analyze(value: string | undefined): HeaderResult;
}

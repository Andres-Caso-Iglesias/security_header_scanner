import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CoopChecker implements HeaderChecker {
    readonly name = "COOP";
    readonly severity: "medium";
    readonly weight = 10;
    analyze(value: string | undefined): HeaderResult;
}

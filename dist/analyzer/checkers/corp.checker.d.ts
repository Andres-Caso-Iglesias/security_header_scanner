import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CorpChecker implements HeaderChecker {
    readonly name = "CORP";
    readonly severity: "medium";
    readonly weight = 10;
    analyze(value: string | undefined): HeaderResult;
}

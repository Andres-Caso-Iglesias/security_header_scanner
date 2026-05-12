import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CacheControlChecker implements HeaderChecker {
    readonly name = "Cache-Control";
    readonly severity: "medium";
    readonly weight = 10;
    analyze(value: string | undefined): HeaderResult;
}

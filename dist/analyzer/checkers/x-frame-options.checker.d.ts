import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class XFrameOptionsChecker implements HeaderChecker {
    readonly name = "X-Frame-Options";
    readonly severity: "high";
    readonly weight = 15;
    analyze(value: string | undefined): HeaderResult;
}

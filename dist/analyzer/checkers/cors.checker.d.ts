import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CorsChecker implements HeaderChecker {
    readonly name = "CORS";
    readonly severity: "high";
    readonly weight = 15;
    analyze(value: string | undefined): HeaderResult;
}

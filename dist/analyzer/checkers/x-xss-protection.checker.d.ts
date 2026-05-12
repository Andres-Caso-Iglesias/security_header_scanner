import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class XXssProtectionChecker implements HeaderChecker {
    readonly name = "X-XSS-Protection";
    readonly severity: "low";
    readonly weight = 5;
    analyze(value: string | undefined): HeaderResult;
}

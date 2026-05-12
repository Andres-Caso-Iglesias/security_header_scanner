import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class ReferrerPolicyChecker implements HeaderChecker {
    readonly name = "Referrer-Policy";
    readonly severity: "medium";
    readonly weight = 10;
    private readonly strictPolicies;
    analyze(value: string | undefined): HeaderResult;
}

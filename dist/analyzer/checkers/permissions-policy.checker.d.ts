import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class PermissionsPolicyChecker implements HeaderChecker {
    readonly name = "Permissions-Policy";
    readonly severity: "medium";
    readonly weight = 10;
    analyze(value: string | undefined): HeaderResult;
}

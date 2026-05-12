import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class XContentTypeOptionsChecker implements HeaderChecker {
    readonly name = "X-Content-Type-Options";
    readonly severity: "medium";
    readonly weight = 10;
    analyze(value: string | undefined): HeaderResult;
}

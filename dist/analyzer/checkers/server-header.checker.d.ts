import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class ServerHeaderChecker implements HeaderChecker {
    readonly name = "Server-Header";
    readonly severity: "low";
    readonly weight = 5;
    analyze(value: string | undefined): HeaderResult;
}

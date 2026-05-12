import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class CoepChecker implements HeaderChecker {
    readonly name = "COEP";
    readonly severity: "low";
    readonly weight = 5;
    analyze(value: string | undefined): HeaderResult;
}

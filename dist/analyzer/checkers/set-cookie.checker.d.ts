import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';
export declare class SetCookieChecker implements HeaderChecker {
    readonly name = "Set-Cookie";
    readonly severity: "high";
    readonly weight = 15;
    private readonly securePattern;
    private readonly httpOnlyPattern;
    private readonly sameSitePattern;
    private readonly sameSiteNonePattern;
    analyze(value: string | undefined): HeaderResult;
    private splitCookies;
}

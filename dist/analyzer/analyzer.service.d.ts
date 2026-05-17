import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import { ScoreCalculator } from './score-calculator';
import { CspChecker } from './checkers/csp.checker';
import { HstsChecker } from './checkers/hsts.checker';
import { XFrameOptionsChecker } from './checkers/x-frame-options.checker';
import { XContentTypeOptionsChecker } from './checkers/x-content-type-options.checker';
import { ReferrerPolicyChecker } from './checkers/referrer-policy.checker';
import { PermissionsPolicyChecker } from './checkers/permissions-policy.checker';
import { CacheControlChecker } from './checkers/cache-control.checker';
import { CorsChecker } from './checkers/cors.checker';
import { SetCookieChecker } from './checkers/set-cookie.checker';
import { CorpChecker } from './checkers/corp.checker';
import { CoopChecker } from './checkers/coop.checker';
import { CoepChecker } from './checkers/coep.checker';
import { XPoweredByChecker } from './checkers/x-powered-by.checker';
import { ServerHeaderChecker } from './checkers/server-header.checker';
import { XXssProtectionChecker } from './checkers/x-xss-protection.checker';
export interface AnalysisResult {
    headers: HeaderResult[];
    score: number;
    grade: string;
}
export declare class AnalyzerService {
    private readonly scoreCalculator;
    private readonly checkers;
    constructor(scoreCalculator: ScoreCalculator, cspChecker: CspChecker, hstsChecker: HstsChecker, xFrameOptionsChecker: XFrameOptionsChecker, xContentTypeOptionsChecker: XContentTypeOptionsChecker, referrerPolicyChecker: ReferrerPolicyChecker, permissionsPolicyChecker: PermissionsPolicyChecker, cacheControlChecker: CacheControlChecker, corsChecker: CorsChecker, setCookieChecker: SetCookieChecker, corpChecker: CorpChecker, coopChecker: CoopChecker, coepChecker: CoepChecker, xPoweredByChecker: XPoweredByChecker, serverHeaderChecker: ServerHeaderChecker, xXssProtectionChecker: XXssProtectionChecker);
    analyze(rawHeaders: Record<string, string>): AnalysisResult;
}

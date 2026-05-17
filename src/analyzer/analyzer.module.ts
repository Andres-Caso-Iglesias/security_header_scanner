import { Module } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
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

@Module({
  providers: [
    AnalyzerService,
    ScoreCalculator,
    CspChecker,
    HstsChecker,
    XFrameOptionsChecker,
    XContentTypeOptionsChecker,
    ReferrerPolicyChecker,
    PermissionsPolicyChecker,
    CacheControlChecker,
    CorsChecker,
    SetCookieChecker,
    CorpChecker,
    CoopChecker,
    CoepChecker,
    XPoweredByChecker,
    ServerHeaderChecker,
    XXssProtectionChecker,
  ],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}

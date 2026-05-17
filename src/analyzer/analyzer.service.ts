import { Injectable } from '@nestjs/common';
import type { HeaderChecker, HeaderResult } from '../common/interfaces/header-checker.interface';
import { HEADER_WEIGHTS } from '../common/constants/header-weights';
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

@Injectable()
export class AnalyzerService {
  private readonly checkers: HeaderChecker[];

  constructor(
    private readonly scoreCalculator: ScoreCalculator,
    cspChecker: CspChecker,
    hstsChecker: HstsChecker,
    xFrameOptionsChecker: XFrameOptionsChecker,
    xContentTypeOptionsChecker: XContentTypeOptionsChecker,
    referrerPolicyChecker: ReferrerPolicyChecker,
    permissionsPolicyChecker: PermissionsPolicyChecker,
    cacheControlChecker: CacheControlChecker,
    corsChecker: CorsChecker,
    setCookieChecker: SetCookieChecker,
    corpChecker: CorpChecker,
    coopChecker: CoopChecker,
    coepChecker: CoepChecker,
    xPoweredByChecker: XPoweredByChecker,
    serverHeaderChecker: ServerHeaderChecker,
    xXssProtectionChecker: XXssProtectionChecker,
  ) {
    this.checkers = [
      cspChecker,
      hstsChecker,
      xFrameOptionsChecker,
      xContentTypeOptionsChecker,
      referrerPolicyChecker,
      permissionsPolicyChecker,
      cacheControlChecker,
      corsChecker,
      setCookieChecker,
      corpChecker,
      coopChecker,
      coepChecker,
      xPoweredByChecker,
      serverHeaderChecker,
      xXssProtectionChecker,
    ];
  }

  analyze(rawHeaders: Record<string, string>): AnalysisResult {
    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawHeaders)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }

    const results: HeaderResult[] = [];

    for (const config of HEADER_WEIGHTS) {
      const headerNameLower = config.headerName.toLowerCase();
      const headerValue = normalizedHeaders[headerNameLower];

      const checker = this.checkers.find(
        (c) => c.name === config.name,
      );

      if (checker) {
        results.push(checker.analyze(headerValue));
      } else {
        results.push({
          header: config.headerName,
          present: headerValue !== undefined,
          value: headerValue ?? null,
          expected: config.expectedValue,
          grade: headerValue !== undefined ? 0.5 : 0,
          severity: config.severity,
          weight: config.weight,
          finding:
            headerValue !== undefined
              ? `${config.headerName} is present but could not be fully analyzed`
              : `${config.headerName} is missing`,
          recommendation: `Implement ${config.headerName} header: ${config.expectedValue}`,
        });
      }
    }

    const { score, grade } = this.scoreCalculator.calculate(results);

    return {
      headers: results,
      score,
      grade,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

@Injectable()
export class CacheControlChecker implements HeaderChecker {
  readonly name = 'Cache-Control';
  readonly severity = 'medium' as const;
  readonly weight = 10;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Cache-Control',
        present: false,
        value: null,
        expected: 'no-store for sensitive endpoints',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding:
          'Cache-Control header is missing — sensitive data may be cached by browsers and proxies',
        recommendation:
          'Add Cache-Control headers. For sensitive data: Cache-Control: no-store. For static assets: Cache-Control: public, max-age=31536000, immutable',
      };
    }

    const lower = value.toLowerCase();
    const hasNoStore = /\bno-store\b/.test(lower);
    const hasNoCache = /\bno-cache\b/.test(lower);
    const hasPrivate = /\bprivate\b/.test(lower);
    const hasPublic = /\bpublic\b/.test(lower);

    let grade = 0.3;
    let finding: string;

    if (hasNoStore) {
      grade = 1.0;
      finding = 'Cache-Control is set to no-store — sensitive data will not be cached';
    } else if (hasNoCache && hasPrivate) {
      grade = 0.7;
      finding =
        'Cache-Control uses no-cache + private — reasonable protection but no-store is preferred for sensitive data';
    } else if (hasNoCache) {
      grade = 0.5;
      finding = 'Cache-Control uses no-cache — browser will revalidate but may still cache';
    } else if (hasPrivate) {
      grade = 0.4;
      finding = 'Cache-Control allows private caching (browser only, not proxies)';
    } else if (hasPublic) {
      grade = 0.2;
      finding = 'Cache-Control allows public caching — sensitive data should not be cached';
    } else {
      finding = `Cache-Control has value: ${value} — review if this is appropriate`;
    }

    return {
      header: 'Cache-Control',
      present: true,
      value,
      expected: 'no-store for sensitive endpoints',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation:
        grade < 1.0
          ? 'Consider using Cache-Control: no-store for sensitive endpoints, and appropriate caching headers for public assets'
          : 'Cache-Control is properly configured for sensitive data',
    };
  }
}

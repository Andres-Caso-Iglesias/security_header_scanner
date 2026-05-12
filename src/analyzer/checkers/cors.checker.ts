import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class CorsChecker implements HeaderChecker {
  readonly name = 'CORS';
  readonly severity = 'high' as const;
  readonly weight = 15;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Access-Control-Allow-Origin',
        present: false,
        value: null,
        expected: 'Specific origin, not wildcard',
        grade: 1.0,
        severity: this.severity,
        weight: this.weight,
        finding: 'CORS header not present — no cross-origin requests allowed (secure by default)',
        recommendation:
          'If cross-origin access is needed, set specific origins, not wildcards. If not needed, no action required.',
      };
    }

    const trimmed = value.trim();
    const isWildcard = trimmed === '*';
    const hasNullOrigin = trimmed === 'null';
    const isSpecificOrigin = trimmed.startsWith('http') && !isWildcard;

    let grade: number;
    let finding: string;
    let recommendation: string;

    if (isWildcard) {
      grade = 0;
      finding = 'CORS is configured with wildcard (*) — any origin can access resources';
      recommendation =
        'CRITICAL: Replace wildcard (*) with specific allowed origins. Example: Access-Control-Allow-Origin: https://yourdomain.com';
    } else if (hasNullOrigin) {
      grade = 0.1;
      finding = 'CORS allows null origin — this is dangerous and should be avoided';
      recommendation = 'Remove "null" from allowed origins. Use specific origins instead.';
    } else if (isSpecificOrigin) {
      grade = 1.0;
      finding = `CORS is properly restricted to: ${value}`;
      recommendation = 'CORS is properly configured with specific origins';
    } else {
      grade = 0.5;
      finding = `CORS has non-standard value: ${value}`;
      recommendation = 'Ensure CORS configuration uses valid origins';
    }

    return {
      header: 'Access-Control-Allow-Origin',
      present: true,
      value,
      expected: 'Specific origin, not wildcard',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation,
    };
  }
}

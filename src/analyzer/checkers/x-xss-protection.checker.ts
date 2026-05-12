import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class XXssProtectionChecker implements HeaderChecker {
  readonly name = 'X-XSS-Protection';
  readonly severity = 'low' as const;
  readonly weight = 5;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'X-XSS-Protection',
        present: false,
        value: null,
        expected: '0 (deprecated, use CSP instead)',
        grade: 1.0,
        severity: this.severity,
        weight: this.weight,
        finding:
          'X-XSS-Protection is not present — this is fine as the header is deprecated in favor of CSP',
        recommendation:
          'No action needed. Use Content-Security-Policy (CSP) for XSS protection instead.',
      };
    }

    const trimmed = value.trim();
    let grade: number;
    let finding: string;
    let recommendation: string;

    if (trimmed === '0') {
      grade = 1.0;
      finding =
        'X-XSS-Protection is explicitly disabled (0) — modern browsers ignore this, CSP handles XSS';
      recommendation = 'No action needed. This is the recommended setting for X-XSS-Protection.';
    } else if (trimmed === '1' || trimmed === '1; mode=block') {
      grade = 0.3;
      finding = `X-XSS-Protection is set to "${value}" — deprecated and may introduce XSS vulnerabilities in older browsers`;
      recommendation =
        'Set X-XSS-Protection: 0 (disable) and rely on Content-Security-Policy for XSS protection';
    } else {
      grade = 0.2;
      finding = `X-XSS-Protection has non-standard value: "${value}"`;
      recommendation = 'Set X-XSS-Protection: 0 and use CSP instead';
    }

    return {
      header: 'X-XSS-Protection',
      present: true,
      value,
      expected: '0 (deprecated, use CSP instead)',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation,
    };
  }
}

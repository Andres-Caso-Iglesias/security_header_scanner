import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class XFrameOptionsChecker implements HeaderChecker {
  readonly name = 'X-Frame-Options';
  readonly severity = 'high' as const;
  readonly weight = 15;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'X-Frame-Options',
        present: false,
        value: null,
        expected: 'DENY or SAMEORIGIN',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding: 'X-Frame-Options header is missing — site is vulnerable to clickjacking attacks',
        recommendation:
          'Add: X-Frame-Options: DENY (preferred) or X-Frame-Options: SAMEORIGIN (if frames from same origin are needed)',
      };
    }

    const upper = value.toUpperCase().trim();
    let grade = 0.3;
    let finding: string;

    if (upper === 'DENY') {
      grade = 1.0;
      finding = 'X-Frame-Options is set to DENY — best protection against clickjacking';
    } else if (upper === 'SAMEORIGIN') {
      grade = 0.8;
      finding = 'X-Frame-Options is set to SAMEORIGIN — allows framing from same origin';
    } else if (upper === 'ALLOW-FROM') {
      grade = 0.5;
      finding =
        'X-Frame-Options uses ALLOW-FROM (deprecated, consider CSP frame-ancestors instead)';
    } else {
      finding = `X-Frame-Options has unrecognized value: ${value}`;
    }

    return {
      header: 'X-Frame-Options',
      present: true,
      value,
      expected: 'DENY or SAMEORIGIN',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation:
        grade < 1.0
          ? 'Set X-Frame-Options: DENY for complete clickjacking protection'
          : 'X-Frame-Options is properly configured',
    };
  }
}

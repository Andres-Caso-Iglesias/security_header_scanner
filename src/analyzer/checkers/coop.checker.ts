import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class CoopChecker implements HeaderChecker {
  readonly name = 'COOP';
  readonly severity = 'medium' as const;
  readonly weight = 10;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Cross-Origin-Opener-Policy',
        present: false,
        value: null,
        expected: 'same-origin',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding:
          'Cross-Origin-Opener-Policy is missing — window may be accessible cross-origin (Spectre-like attacks)',
        recommendation:
          'Add: Cross-Origin-Opener-Policy: same-origin (or same-origin-allow-popups if popups need access)',
      };
    }

    const lower = value.toLowerCase().trim();
    let grade: number;
    let finding: string;

    if (lower === 'same-origin') {
      grade = 1.0;
      finding = 'COOP is set to same-origin — best isolation against cross-origin attacks';
    } else if (lower === 'same-origin-allow-popups') {
      grade = 0.6;
      finding = 'COOP is set to same-origin-allow-popups — allows popups to access window';
    } else if (lower === 'unsafe-none') {
      grade = 0;
      finding = 'COOP is set to unsafe-none — no cross-origin isolation';
    } else {
      grade = 0.3;
      finding = `COOP has unrecognized value: ${value}`;
    }

    return {
      header: 'Cross-Origin-Opener-Policy',
      present: true,
      value,
      expected: 'same-origin',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation:
        grade < 1.0
          ? 'Set Cross-Origin-Opener-Policy: same-origin for strong cross-origin isolation'
          : 'COOP is properly configured',
    };
  }
}

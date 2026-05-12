import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class XContentTypeOptionsChecker implements HeaderChecker {
  readonly name = 'X-Content-Type-Options';
  readonly severity = 'medium' as const;
  readonly weight = 10;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'X-Content-Type-Options',
        present: false,
        value: null,
        expected: 'nosniff',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding:
          'X-Content-Type-Options header is missing — browser may perform MIME-type sniffing',
        recommendation: 'Add: X-Content-Type-Options: nosniff',
      };
    }

    const normalized = value.toLowerCase().trim();
    const isNosniff = normalized === 'nosniff';

    return {
      header: 'X-Content-Type-Options',
      present: true,
      value,
      expected: 'nosniff',
      grade: isNosniff ? 1.0 : 0.3,
      severity: this.severity,
      weight: this.weight,
      finding: isNosniff
        ? 'X-Content-Type-Options is set to nosniff — prevents MIME sniffing'
        : `X-Content-Type-Options has unexpected value: ${value}`,
      recommendation: isNosniff
        ? 'X-Content-Type-Options is properly configured'
        : 'Set X-Content-Type-Options: nosniff exactly',
    };
  }
}

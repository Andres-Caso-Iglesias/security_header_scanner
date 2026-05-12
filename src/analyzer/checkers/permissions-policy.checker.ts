import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class PermissionsPolicyChecker implements HeaderChecker {
  readonly name = 'Permissions-Policy';
  readonly severity = 'medium' as const;
  readonly weight = 10;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Permissions-Policy',
        present: false,
        value: null,
        expected: 'Restrictive policy without wildcards',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding: 'Permissions-Policy header is missing — all browser APIs are available by default',
        recommendation:
          'Add a Permissions-Policy header to restrict access to sensitive APIs (camera, microphone, geolocation, etc.)',
      };
    }

    const hasWildcard = /\b\*\)/.test(value);
    const hasGeolocation = /\bgeolocation/i.test(value);
    const hasCamera = /\bcamera\b/i.test(value);
    const hasMicrophone = /\bmicrophone\b/i.test(value);

    let grade = 0.5;
    const issues: string[] = [];

    if (hasWildcard) {
      grade = 0.2;
      issues.push('contains wildcard (*) permissions');
    }

    if (hasGeolocation || hasCamera || hasMicrophone) {
      grade = Math.min(grade + 0.3, 1.0);
    } else {
      issues.push('consider explicitly restricting sensitive APIs');
    }

    if (!hasWildcard && !issues.length) {
      grade = 0.8;
    }

    return {
      header: 'Permissions-Policy',
      present: true,
      value,
      expected: 'Restrictive policy without wildcards',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding:
        issues.length > 0
          ? `Permissions-Policy is present but ${issues.join(', ')}`
          : 'Permissions-Policy is present',
      recommendation: issues.includes('contains wildcard (*) permissions')
        ? 'Remove wildcard (*) permissions. Explicitly list allowed origins for each feature.'
        : 'Review and tighten Permissions-Policy to only allow necessary features',
    };
  }
}

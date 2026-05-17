import { Injectable } from '@nestjs/common';
import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

@Injectable()
export class CoepChecker implements HeaderChecker {
  readonly name = 'COEP';
  readonly severity = 'low' as const;
  readonly weight = 5;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Cross-Origin-Embedder-Policy',
        present: false,
        value: null,
        expected: 'require-corp',
        grade: 0,
        severity: this.severity,
        weight: this.weight,
        finding:
          'Cross-Origin-Embedder-Policy is missing — cross-origin resources can be embedded without explicit policy',
        recommendation:
          'Consider adding: Cross-Origin-Embedder-Policy: require-corp (requires CORP/CORS on all cross-origin resources)',
      };
    }

    const lower = value.toLowerCase().trim();
    let grade: number;
    let finding: string;

    if (lower === 'require-corp') {
      grade = 1.0;
      finding =
        'COEP is set to require-corp — strong protection, but requires all cross-origin resources to have CORP/CORS headers';
    } else if (lower === 'credentialless') {
      grade = 0.6;
      finding =
        'COEP is set to credentialless — requests without credentials to cross-origin resources';
    } else if (lower === 'unsafe-none') {
      grade = 0;
      finding = 'COEP is set to unsafe-none — no cross-origin embedding restrictions';
    } else {
      grade = 0.3;
      finding = `COEP has unrecognized value: ${value}`;
    }

    return {
      header: 'Cross-Origin-Embedder-Policy',
      present: true,
      value,
      expected: 'require-corp',
      grade,
      severity: this.severity,
      weight: this.weight,
      finding,
      recommendation:
        grade < 1.0
          ? 'Consider COEP: require-corp for cross-origin isolation, but be aware it may break third-party resource loading'
          : 'COEP is properly configured',
    };
  }
}

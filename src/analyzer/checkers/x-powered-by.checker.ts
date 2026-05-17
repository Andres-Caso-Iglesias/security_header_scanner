import { Injectable } from '@nestjs/common';
import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

@Injectable()
export class XPoweredByChecker implements HeaderChecker {
  readonly name = 'X-Powered-By';
  readonly severity = 'low' as const;
  readonly weight = 5;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'X-Powered-By',
        present: false,
        value: null,
        expected: 'Not present',
        grade: 1.0,
        severity: this.severity,
        weight: this.weight,
        finding: 'X-Powered-By header is not present — no technology information leakage',
        recommendation: 'No action needed. This header should remain absent.',
      };
    }

    return {
      header: 'X-Powered-By',
      present: true,
      value,
      expected: 'Not present',
      grade: 0,
      severity: this.severity,
      weight: this.weight,
      finding: `X-Powered-By header exposes technology information: "${value}" — aids attackers in fingerprinting`,
      recommendation:
        'Remove the X-Powered-By header in your server/application configuration to prevent technology fingerprinting',
    };
  }
}

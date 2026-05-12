import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceFinding } from '../interfaces/compliance-finding.interface';

export class OwaspTop10Mapper {
  private readonly version = '2021';

  map(headers: HeaderResult[]): ComplianceFinding[] {
    return [
      this.mapA01BrokenAccessControl(headers),
      this.mapA05SecurityMisconfiguration(headers),
      this.mapA06VulnerableComponents(headers),
    ].flat();
  }

  private mapA01BrokenAccessControl(headers: HeaderResult[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    const cors = headers.find((h) => h.header === 'Access-Control-Allow-Origin');
    const cookies = headers.find((h) => h.header === 'Set-Cookie');

    if (cors) {
      if (cors.grade < 1.0) {
        findings.push({
          control: 'A01.1 - CORS Configuration',
          status: 'non_compliant',
          relatedHeaders: ['Access-Control-Allow-Origin'],
          description: cors.finding,
          recommendation: cors.recommendation,
        });
      } else if (cors.present) {
        findings.push({
          control: 'A01.1 - CORS Configuration',
          status: 'compliant',
          relatedHeaders: ['Access-Control-Allow-Origin'],
          description: 'CORS is properly restricted',
          recommendation: 'Maintain current CORS configuration',
        });
      }
    }

    if (cookies && cookies.present) {
      if (cookies.grade < 1.0) {
        findings.push({
          control: 'A01.2 - Cookie Security',
          status: 'non_compliant',
          relatedHeaders: ['Set-Cookie'],
          description: cookies.finding,
          recommendation: cookies.recommendation,
        });
      } else {
        findings.push({
          control: 'A01.2 - Cookie Security',
          status: 'compliant',
          relatedHeaders: ['Set-Cookie'],
          description: 'Cookies have proper security attributes',
          recommendation: 'Maintain current cookie configuration',
        });
      }
    }

    if (findings.length === 0) {
      findings.push({
        control: 'A01 - Broken Access Control',
        status: 'not_applicable',
        relatedHeaders: [],
        description: 'No CORS or cookie issues detected',
        recommendation: 'Continue monitoring access controls',
      });
    }

    return findings;
  }

  private mapA05SecurityMisconfiguration(headers: HeaderResult[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    const criticalMissing = headers.filter((h) => h.grade < 0.5 && h.severity === 'critical');
    const highMissing = headers.filter((h) => h.grade < 0.5 && h.severity === 'high');

    if (criticalMissing.length > 0) {
      findings.push({
        control: 'A05.1 - Critical Security Headers',
        status: 'non_compliant',
        relatedHeaders: criticalMissing.map((h) => h.header),
        description: `Critical security headers missing or misconfigured: ${criticalMissing.map((h) => h.header).join(', ')}`,
        recommendation: criticalMissing.map((h) => h.recommendation).join(' '),
      });
    } else {
      findings.push({
        control: 'A05.1 - Critical Security Headers',
        status: 'compliant',
        relatedHeaders: [],
        description: 'All critical security headers are properly configured',
        recommendation: 'Continue monitoring security header configuration',
      });
    }

    if (highMissing.length > 0) {
      findings.push({
        control: 'A05.2 - High Priority Security Headers',
        status: 'partially_compliant',
        relatedHeaders: highMissing.map((h) => h.header),
        description: `High severity headers need attention: ${highMissing.map((h) => h.header).join(', ')}`,
        recommendation: highMissing.map((h) => h.recommendation).join(' '),
      });
    }

    return findings;
  }

  private mapA06VulnerableComponents(headers: HeaderResult[]): ComplianceFinding[] {
    const xpb = headers.find((h) => h.header === 'X-Powered-By');
    const server = headers.find((h) => h.header === 'Server');

    const infoLeaks = [xpb, server].filter((h) => h && h.present && h.grade < 0.5);

    if (infoLeaks.length > 0) {
      return [
        {
          control: 'A06.1 - Information Disclosure',
          status: 'non_compliant',
          relatedHeaders: infoLeaks.map((h) => h!.header),
          description: `Server discloses technology information via: ${infoLeaks.map((h) => h!.header).join(', ')}`,
          recommendation:
            'Remove or minimize information-disclosing headers to prevent attacker fingerprinting',
        },
      ];
    }

    return [
      {
        control: 'A06.1 - Information Disclosure',
        status: 'compliant',
        relatedHeaders: [],
        description: 'No technology information leakage detected',
        recommendation: 'Continue to avoid exposing server/technology information',
      },
    ];
  }
}

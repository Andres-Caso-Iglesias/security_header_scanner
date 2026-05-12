import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { ComplianceFinding } from '../interfaces/compliance-finding.interface';

export class OwaspTop10Mapper {
  private readonly version = '2021';

  map(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceFinding[] {
    return [
      ...this.mapA01BrokenAccessControl(headers),
      ...this.mapA05SecurityMisconfiguration(headers, tls, dns),
      ...this.mapA06VulnerableComponents(headers),
    ];
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

  private mapA05SecurityMisconfiguration(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceFinding[] {
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

    // DNS security (SPF, DKIM, DMARC)
    if (dns && dns.checked && !dns.error) {
      const dnsIssues: string[] = [];
      if (!dns.spf.present) dnsIssues.push('SPF');
      if (!dns.dkim.present) dnsIssues.push('DKIM');
      if (!dns.dmarc.present) dnsIssues.push('DMARC');

      if (dnsIssues.length > 0) {
        findings.push({
          control: 'A05.4 - Email Security (SPF/DKIM/DMARC)',
          status: 'non_compliant',
          relatedHeaders: [],
          description: `Missing DNS security records: ${dnsIssues.join(', ')}. Domain is vulnerable to email spoofing.`,
          recommendation: dnsIssues.includes('SPF')
            ? 'Add SPF record to authorise mail senders'
            : dnsIssues.includes('DKIM')
              ? 'Configure DKIM signing and publish public key'
              : 'Publish DMARC policy with p=quarantine or p=reject',
        });
      } else {
        const weakDns: string[] = [];
        if (dns.spf.grade < 1.0) weakDns.push(`SPF (grade ${Math.round(dns.spf.grade * 100)}%)`);
        if (dns.dmarc.grade < 1.0) weakDns.push(`DMARC (grade ${Math.round(dns.dmarc.grade * 100)}%)`);

        if (weakDns.length > 0) {
          findings.push({
            control: 'A05.4 - Email Security (SPF/DKIM/DMARC)',
            status: 'partially_compliant',
            relatedHeaders: [],
            description: `DNS security records present but could be improved: ${weakDns.join(', ')}`,
            recommendation: 'Review SPF and DMARC configurations for optimal protection',
          });
        } else {
          findings.push({
            control: 'A05.4 - Email Security (SPF/DKIM/DMARC)',
            status: 'compliant',
            relatedHeaders: [],
            description: 'All DNS security records (SPF, DKIM, DMARC) properly configured',
            recommendation: 'Maintain current email security configuration',
          });
        }
      }
    }

    // TLS misconfiguration
    if (tls && tls.checked) {
      if (tls.error && tls.error !== 'TLS check only applies to HTTPS URLs') {
        findings.push({
          control: 'A05.3 - TLS Configuration',
          status: 'non_compliant',
          relatedHeaders: [],
          description: `TLS handshake error: ${tls.error}`,
          recommendation: 'Ensure the server supports TLS with a valid certificate',
        });
      } else if (tls.certificate?.expired) {
        findings.push({
          control: 'A05.3 - TLS Configuration',
          status: 'non_compliant',
          relatedHeaders: [],
          description: `SSL certificate expired on ${tls.certificate.validTo}`,
          recommendation: 'Renew the SSL certificate immediately',
        });
      } else if (tls.tlsVersion && tls.tlsVersion < 'TLSv1.2') {
        findings.push({
          control: 'A05.3 - TLS Configuration',
          status: 'non_compliant',
          relatedHeaders: [],
          description: `Outdated TLS version: ${tls.tlsVersion}. TLS 1.2 or higher required.`,
          recommendation: 'Disable TLS 1.0/1.1 and enable TLS 1.2 or 1.3',
        });
      } else if (tls.tlsVersion && tls.grade < 0.8) {
        findings.push({
          control: 'A05.3 - TLS Configuration',
          status: 'partially_compliant',
          relatedHeaders: [],
          description: tls.certificate?.selfSigned
            ? 'SSL certificate is self-signed'
            : tls.certificate?.wildcard
              ? 'SSL certificate uses wildcard'
              : `TLS ${tls.tlsVersion} is configured but has room for improvement`,
          recommendation: tls.certificate?.selfSigned
            ? 'Replace self-signed certificate with one from a trusted CA'
            : 'Review TLS configuration for best practices',
        });
      } else if (tls.grade >= 0.8) {
        findings.push({
          control: 'A05.3 - TLS Configuration',
          status: 'compliant',
          relatedHeaders: [],
          description: `TLS ${tls.tlsVersion} with valid certificate properly configured`,
          recommendation: 'Maintain current TLS configuration',
        });
      }
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

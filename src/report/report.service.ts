import { Injectable } from '@nestjs/common';
import type { ScanResult } from '../common/interfaces/scan-result.interface';
import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import type { ReportInput } from './interfaces/report.interface';

@Injectable()
export class ReportService {
  generate(input: ReportInput): ScanResult {
    const recommendations = this.generateRecommendations(input.headers.headers, input.tls);

    return {
      url: input.url,
      timestamp: new Date().toISOString(),
      score: input.headers.score,
      grade: input.headers.grade,
      headers: input.headers.headers,
      compliance: input.compliance,
      recommendations,
      metadata: input.metadata,
      tls: input.tls,
    };
  }

  private generateRecommendations(headers: HeaderResult[], tls: ReportInput['tls']): string[] {
    const criticalIssues = headers
      .filter((h) => h.severity === 'critical' && h.grade < 1.0)
      .map((h) => `[CRITICAL] ${h.recommendation}`);

    const highIssues = headers
      .filter((h) => h.severity === 'high' && h.grade < 1.0)
      .map((h) => `[HIGH] ${h.recommendation}`);

    const mediumIssues = headers
      .filter((h) => h.severity === 'medium' && h.grade < 1.0)
      .map((h) => `[MEDIUM] ${h.recommendation}`);

    const lowIssues = headers
      .filter((h) => h.severity === 'low' && h.grade < 1.0)
      .map((h) => `[LOW] ${h.recommendation}`);

    // TLS recommendations
    const tlsRecs: string[] = [];
    if (tls.checked && tls.error) {
      if (tls.error !== 'TLS check only applies to HTTPS URLs') {
        tlsRecs.push(`[HIGH] TLS error: ${tls.error}`);
      }
    } else if (tls.checked && tls.certificate) {
      if (tls.certificate.expired) {
        tlsRecs.push(`[CRITICAL] SSL certificate expired on ${tls.certificate.validTo}. Renew immediately.`);
      }
      if (tls.certificate.selfSigned) {
        tlsRecs.push(`[HIGH] SSL certificate is self-signed. Replace with a CA-signed certificate.`);
      }
      if (tls.certificate.expiresInDays >= 0 && tls.certificate.expiresInDays < 30) {
        tlsRecs.push(`[HIGH] SSL certificate expires in ${tls.certificate.expiresInDays} days. Renew soon.`);
      }
      if (tls.tlsVersion && tls.tlsVersion < 'TLSv1.2') {
        tlsRecs.push(`[CRITICAL] Outdated TLS version: ${tls.tlsVersion}. Upgrade to TLS 1.2 or 1.3.`);
      }
    }

    return [...tlsRecs, ...criticalIssues, ...highIssues, ...mediumIssues, ...lowIssues];
  }
}

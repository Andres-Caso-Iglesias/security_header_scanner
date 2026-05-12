import { Injectable } from '@nestjs/common';
import { ScanResult } from '../common/interfaces/scan-result.interface';
import { HeaderResult } from '../common/interfaces/header-checker.interface';
import { ReportInput } from './interfaces/report.interface';

@Injectable()
export class ReportService {
  generate(input: ReportInput): ScanResult {
    const recommendations = this.generateRecommendations(input.headers.headers);

    return {
      url: input.url,
      timestamp: new Date().toISOString(),
      score: input.headers.score,
      grade: input.headers.grade,
      headers: input.headers.headers,
      compliance: input.compliance,
      recommendations,
      metadata: input.metadata,
    };
  }

  private generateRecommendations(headers: HeaderResult[]): string[] {
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

    return [...criticalIssues, ...highIssues, ...mediumIssues, ...lowIssues];
  }
}

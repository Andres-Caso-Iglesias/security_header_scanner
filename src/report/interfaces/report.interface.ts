export interface ReportInput {
  url: string;
  headers: {
    headers: import('../../common/interfaces/header-checker.interface').HeaderResult[];
    score: number;
    grade: string;
  };
  compliance: import('../../common/interfaces/scan-result.interface').ComplianceSection[];
  metadata: {
    responseTime: number;
    statusCode: number;
    analyzedAt: string;
  };
}

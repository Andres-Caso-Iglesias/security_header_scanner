import { Module } from '@nestjs/common';
import { ScannerModule } from './scanner/scanner.module';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [ScannerModule, AnalyzerModule, ComplianceModule, ReportModule],
})
export class AppModule {}

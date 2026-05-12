import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { HttpClientService } from './http-client/http-client.service';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    AnalyzerModule,
    ComplianceModule,
    ReportModule,
  ],
  controllers: [ScannerController],
  providers: [ScannerService, HttpClientService],
  exports: [ScannerService],
})
export class ScannerModule {}

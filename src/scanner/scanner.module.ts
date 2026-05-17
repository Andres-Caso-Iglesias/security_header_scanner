import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { HttpClientService } from './http-client/http-client.service';
import { TlsCheckerService } from './tls/tls-checker.service';
import { DnsCheckerService } from './dns/dns-checker.service';
import { SecurityFileCheckerService } from './files/security-file-checker.service';
import { SensitiveFileCheckerService } from './files/sensitive-file-checker.service';
import { SriCheckerService } from './content/sri-checker.service';
import { TechFingerprinterService } from './fingerprint/tech-fingerprinter.service';
import { CveApiService } from './fingerprint/cve-api.service';
import { ExportService } from '../report/export/export.service';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ReportModule } from '../report/report.module';
import { HistoryModule } from '../history/history.module';
import { TIMEOUTS } from '../common/constants/timeout.config';

@Module({
  imports: [
    HttpModule.register({
      timeout: TIMEOUTS.HTTP_CLIENT,
      maxRedirects: 5,
    }),
    AnalyzerModule,
    ComplianceModule,
    ReportModule,
    HistoryModule,
  ],
  controllers: [ScannerController],
  providers: [
    ScannerService, HttpClientService, TlsCheckerService, DnsCheckerService,
    SecurityFileCheckerService, SensitiveFileCheckerService, SriCheckerService,
    TechFingerprinterService, CveApiService, ExportService,
  ],
  exports: [ScannerService],
})
export class ScannerModule {}

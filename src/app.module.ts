import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScannerModule } from './scanner/scanner.module';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ReportModule } from './report/report.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { SECURITY } from './common/config/security.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: SECURITY.RATE_LIMIT_WINDOW_MS,
      limit: SECURITY.RATE_LIMIT_MAX,
    }]),
    ScannerModule,
    AnalyzerModule,
    ComplianceModule,
    ReportModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

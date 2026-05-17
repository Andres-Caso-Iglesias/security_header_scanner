import { Test, TestingModule } from '@nestjs/testing';
import { ScannerService } from '../../../src/scanner/scanner.service';
import { HttpClientService } from '../../../src/scanner/http-client/http-client.service';
import { TlsCheckerService } from '../../../src/scanner/tls/tls-checker.service';
import { DnsCheckerService } from '../../../src/scanner/dns/dns-checker.service';
import { SecurityFileCheckerService } from '../../../src/scanner/files/security-file-checker.service';
import { SensitiveFileCheckerService } from '../../../src/scanner/files/sensitive-file-checker.service';
import { SriCheckerService } from '../../../src/scanner/content/sri-checker.service';
import { TechFingerprinterService } from '../../../src/scanner/fingerprint/tech-fingerprinter.service';
import { AnalyzerService } from '../../../src/analyzer/analyzer.service';
import { ComplianceService } from '../../../src/compliance/compliance.service';
import { ReportService } from '../../../src/report/report.service';
import { ExportService } from '../../../src/report/export/export.service';
import { ScoreCalculator } from '../../../src/analyzer/score-calculator';
import { HistoryService } from '../../../src/history/history.service';
import { CspChecker } from '../../../src/analyzer/checkers/csp.checker';
import { HstsChecker } from '../../../src/analyzer/checkers/hsts.checker';
import { XFrameOptionsChecker } from '../../../src/analyzer/checkers/x-frame-options.checker';
import { XContentTypeOptionsChecker } from '../../../src/analyzer/checkers/x-content-type-options.checker';
import { ReferrerPolicyChecker } from '../../../src/analyzer/checkers/referrer-policy.checker';
import { PermissionsPolicyChecker } from '../../../src/analyzer/checkers/permissions-policy.checker';
import { CacheControlChecker } from '../../../src/analyzer/checkers/cache-control.checker';
import { CorsChecker } from '../../../src/analyzer/checkers/cors.checker';
import { SetCookieChecker } from '../../../src/analyzer/checkers/set-cookie.checker';
import { CorpChecker } from '../../../src/analyzer/checkers/corp.checker';
import { CoopChecker } from '../../../src/analyzer/checkers/coop.checker';
import { CoepChecker } from '../../../src/analyzer/checkers/coep.checker';
import { XPoweredByChecker } from '../../../src/analyzer/checkers/x-powered-by.checker';
import { ServerHeaderChecker } from '../../../src/analyzer/checkers/server-header.checker';
import { XXssProtectionChecker } from '../../../src/analyzer/checkers/x-xss-protection.checker';
import { OwaspTop10Mapper } from '../../../src/compliance/mappers/owasp-top10.mapper';
import { Nis2Mapper } from '../../../src/compliance/mappers/nis2.mapper';
import { EnsMapper } from '../../../src/compliance/mappers/ens.mapper';
import { Iso27001Mapper } from '../../../src/compliance/mappers/iso27001.mapper';

describe('ScannerService', () => {
  let service: ScannerService;
  let httpClient: jest.Mocked<HttpClientService>;

  const mockDnsResult = {
    hostname: 'example.com',
    checked: true,
    error: null,
    spf: { type: 'SPF', value: 'v=spf1 -all', present: true, grade: 1.0, finding: 'SPF OK', recommendation: '' },
    dkim: { type: 'DKIM', value: 'v=DKIM1; p=key', present: true, grade: 1.0, finding: 'DKIM OK', recommendation: '' },
    dmarc: { type: 'DMARC', value: 'v=DMARC1; p=reject', present: true, grade: 1.0, finding: 'DMARC OK', recommendation: '' },
    grade: 1.0,
  };

  const mockFingerprintResult = {
    checked: true, technologies: [], cves: [], grade: 1.0, summary: 'No technologies detected',
  };

  const mockSriResult = {
    checked: true, totalResources: 0, secureResources: 0, insecureResources: [], grade: 1.0,
    finding: 'No external resources', recommendation: 'No action needed',
  };

  const mockSensitiveFilesResult = {
    checked: true, files: [], exposedCount: 0, grade: 1.0,
  };

  const mockSecurityFilesResult = {
    checked: true,
    securityTxt: { path: '/.well-known/security.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'Not found', recommendation: 'Add security.txt' },
    robotsTxt: { path: '/robots.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'Not found', recommendation: 'Add robots.txt' },
    grade: 0,
  };

  const mockTlsResult = {
    checked: true,
    hostname: 'example.com',
    port: 443,
    error: null,
    tlsVersion: 'TLSv1.3',
    certificate: {
      subject: 'CN=example.com',
      issuer: 'CN=CA',
      validFrom: '2025-01-01T00:00:00Z',
      validTo: '2026-01-01T00:00:00Z',
      expiresInDays: 100,
      expired: false,
      selfSigned: false,
      wildcard: false,
      fingerprint: 'AA:BB:CC:DD',
      serialNumber: '12345',
      san: ['example.com'],
    },
    grade: 1.0,
  };

  beforeEach(async () => {
    httpClient = {
      fetch: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScannerService,
        { provide: HttpClientService, useValue: httpClient },
        { provide: TlsCheckerService, useValue: { check: jest.fn().mockResolvedValue(mockTlsResult) } },
        { provide: DnsCheckerService, useValue: { check: jest.fn().mockResolvedValue(mockDnsResult) } },
        { provide: SecurityFileCheckerService, useValue: { check: jest.fn().mockResolvedValue(mockSecurityFilesResult) } },
        { provide: SensitiveFileCheckerService, useValue: { check: jest.fn().mockResolvedValue(mockSensitiveFilesResult) } },
        { provide: SriCheckerService, useValue: { check: jest.fn().mockResolvedValue(mockSriResult) } },
        { provide: TechFingerprinterService, useValue: { fingerprint: jest.fn().mockResolvedValue(mockFingerprintResult) } },
        AnalyzerService,
        ScoreCalculator,
        CspChecker,
        HstsChecker,
        XFrameOptionsChecker,
        XContentTypeOptionsChecker,
        ReferrerPolicyChecker,
        PermissionsPolicyChecker,
        CacheControlChecker,
        CorsChecker,
        SetCookieChecker,
        CorpChecker,
        CoopChecker,
        CoepChecker,
        XPoweredByChecker,
        ServerHeaderChecker,
        XXssProtectionChecker,
        ComplianceService,
        OwaspTop10Mapper,
        Nis2Mapper,
        EnsMapper,
        Iso27001Mapper,
        ReportService,
        HistoryService,
      ],
    }).compile();

    service = module.get<ScannerService>(ScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call httpClient.fetch with the URL', async () => {
    httpClient.fetch.mockResolvedValue({
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
      responseTime: 100,
    });

    const result = await service.scan('https://example.com');
    expect(httpClient.fetch).toHaveBeenCalledWith('https://example.com');
    expect(result.url).toBe('https://example.com');
    expect(result.score).toBeDefined();
    expect(result.grade).toBeDefined();
    expect(result.headers).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.metadata.statusCode).toBe(200);
  });
});

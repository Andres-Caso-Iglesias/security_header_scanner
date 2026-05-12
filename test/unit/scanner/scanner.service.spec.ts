import { Test, TestingModule } from '@nestjs/testing';
import { ScannerService } from '../../../src/scanner/scanner.service';
import { HttpClientService } from '../../../src/scanner/http-client/http-client.service';
import { TlsCheckerService } from '../../../src/scanner/tls/tls-checker.service';
import { AnalyzerService } from '../../../src/analyzer/analyzer.service';
import { ComplianceService } from '../../../src/compliance/compliance.service';
import { ReportService } from '../../../src/report/report.service';
import { ScoreCalculator } from '../../../src/analyzer/score-calculator';

describe('ScannerService', () => {
  let service: ScannerService;
  let httpClient: jest.Mocked<HttpClientService>;

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
        AnalyzerService,
        ScoreCalculator,
        ComplianceService,
        ReportService,
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

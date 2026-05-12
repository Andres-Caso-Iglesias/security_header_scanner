import { Test, TestingModule } from '@nestjs/testing';
import { ScannerService } from '../../../src/scanner/scanner.service';
import { HttpClientService } from '../../../src/scanner/http-client/http-client.service';
import { AnalyzerService } from '../../../src/analyzer/analyzer.service';
import { ComplianceService } from '../../../src/compliance/compliance.service';
import { ReportService } from '../../../src/report/report.service';
import { ScoreCalculator } from '../../../src/analyzer/score-calculator';

describe('ScannerService', () => {
  let service: ScannerService;
  let httpClient: jest.Mocked<HttpClientService>;

  beforeEach(async () => {
    httpClient = {
      fetch: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScannerService,
        { provide: HttpClientService, useValue: httpClient },
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

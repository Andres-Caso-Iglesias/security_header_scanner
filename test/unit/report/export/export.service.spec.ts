import { ExportService } from '../../../../src/report/export/export.service';
import type { ScanResult } from '../../../../src/common/interfaces/scan-result.interface';

jest.mock('pdfkit', () => jest.fn(() => {
  const mockDoc: any = {
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    roundedRect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    addPage: jest.fn(),
    page: { width: 595, height: 842, margins: { top: 50, bottom: 50, left: 50, right: 50 } },
    y: 200,
    _dataCallbacks: [] as Function[],
    _endCallbacks: [] as Function[],
    _errorCallbacks: [] as Function[],
    on: jest.fn(function (this: any, event: string, cb: Function) {
      if (event === 'data') this._dataCallbacks.push(cb);
      if (event === 'end') this._endCallbacks.push(cb);
      if (event === 'error') this._errorCallbacks.push(cb);
      return this;
    }),
    end: jest.fn(function (this: any) {
      this._dataCallbacks.forEach((cb: Function) => cb(Buffer.from('%PDF-1.4\nmock content')));
      this._endCallbacks.forEach((cb: Function) => cb());
    }),
  };
  return mockDoc;
}));

function createMockScanResult(overrides?: Partial<ScanResult>): ScanResult {
  return {
    url: 'https://example.com',
    timestamp: '2024-01-15T10:30:00.000Z',
    score: 85,
    grade: 'B',
    headers: [
      {
        header: 'Strict-Transport-Security',
        present: true,
        value: 'max-age=31536000',
        expected: 'max-age=31536000',
        grade: 1,
        severity: 'high',
        weight: 10,
        finding: 'Header is present and properly configured',
        recommendation: '',
      },
    ],
    compliance: [
      {
        framework: 'OWASP',
        version: '2021',
        findings: [
          {
            control: 'HSTS',
            status: 'compliant',
            relatedHeaders: ['Strict-Transport-Security'],
            description: 'HSTS is properly configured',
            recommendation: '',
          },
        ],
      },
    ],
    recommendations: ['[MEDIUM] Add Content-Security-Policy header', '[LOW] Enable X-Content-Type-Options'],
    metadata: { responseTime: 150, statusCode: 200, analyzedAt: '2024-01-15T10:30:00.000Z' },
    tls: {
      checked: true,
      hostname: 'example.com',
      port: 443,
      error: null,
      tlsVersion: 'TLSv1.3',
      certificate: {
        subject: 'CN=example.com',
        issuer: 'CN=CA',
        validFrom: '2024-01-01T00:00:00Z',
        validTo: '2025-01-01T00:00:00Z',
        expiresInDays: 100,
        expired: false,
        selfSigned: false,
        wildcard: false,
        fingerprint: 'AA:BB:CC:DD',
        serialNumber: '12345',
        san: ['example.com'],
      },
      grade: 1,
    },
    dns: {
      hostname: 'example.com',
      checked: true,
      error: null,
      spf: { type: 'SPF', value: 'v=spf1 -all', present: true, grade: 1, finding: 'SPF present', recommendation: '' },
      dkim: { type: 'DKIM', value: 'v=DKIM1; p=', present: true, grade: 1, finding: 'DKIM present', recommendation: '' },
      dmarc: { type: 'DMARC', value: 'v=DMARC1; p=reject', present: true, grade: 1, finding: 'DMARC present', recommendation: '' },
      grade: 1,
    },
    securityFiles: {
      checked: true,
      securityTxt: { path: '/.well-known/security.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'Not found', recommendation: 'Add security.txt' },
      robotsTxt: { path: '/robots.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'Not found', recommendation: 'Add robots.txt' },
      grade: 0,
    },
    sri: {
      checked: true,
      totalResources: 0,
      secureResources: 0,
      insecureResources: [],
      grade: 1,
      finding: 'No external resources detected',
      recommendation: '',
    },
    sensitiveFiles: {
      checked: true,
      files: [],
      exposedCount: 0,
      grade: 1,
    },
    fingerprint: {
      checked: true,
      technologies: [],
      cves: [],
      grade: 1,
      summary: 'No technologies detected',
    },
    ...overrides,
  };
}

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportService();
  });

  describe('generateJson', () => {
    it('returns a valid JSON string', () => {
      const json = service.generateJson(createMockScanResult());
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes url, score, grade, headers, and recommendations keys', () => {
      const parsed = JSON.parse(service.generateJson(createMockScanResult()));
      expect(parsed).toHaveProperty('url', 'https://example.com');
      expect(parsed).toHaveProperty('score', 85);
      expect(parsed).toHaveProperty('grade', 'B');
      expect(parsed).toHaveProperty('headers');
      expect(parsed).toHaveProperty('recommendations');
    });

    it('includes timestamp in the output', () => {
      const parsed = JSON.parse(service.generateJson(createMockScanResult()));
      expect(parsed).toHaveProperty('timestamp', '2024-01-15T10:30:00.000Z');
    });

    it('handles empty recommendations gracefully', () => {
      const result = createMockScanResult({ recommendations: [] });
      const parsed = JSON.parse(service.generateJson(result));
      expect(parsed.recommendations).toEqual([]);
    });

    it('handles null recommendations gracefully', () => {
      const result = createMockScanResult({ recommendations: null as any });
      const parsed = JSON.parse(service.generateJson(result));
      expect(parsed.recommendations).toBeNull();
    });
  });

  describe('generatePdf', () => {
    it('returns a Buffer', async () => {
      const result = await service.generatePdf(createMockScanResult());
      expect(result).toBeInstanceOf(Buffer);
    });

    it('produces a Buffer starting with PDF magic bytes', async () => {
      const result = await service.generatePdf(createMockScanResult());
      expect(result.slice(0, 5).toString()).toBe('%PDF-');
    });

    it('includes the URL in the PDF content', async () => {
      await service.generatePdf(createMockScanResult());
      const PDFDocument = require('pdfkit');
      const doc = PDFDocument.mock.results[0].value;
      const textArgs = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textArgs.some((arg: string) => arg.includes('https://example.com'))).toBe(true);
    });

    it('includes the score in the PDF content', async () => {
      await service.generatePdf(createMockScanResult());
      const PDFDocument = require('pdfkit');
      const doc = PDFDocument.mock.results[0].value;
      const textArgs = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textArgs.some((arg: string) => arg.includes('85'))).toBe(true);
    });
  });
});

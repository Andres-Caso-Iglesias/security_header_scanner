import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, Observable } from 'rxjs';
import { CveApiService } from '../../../../src/scanner/fingerprint/cve-api.service';
import { TechFingerprinterService } from '../../../../src/scanner/fingerprint/tech-fingerprinter.service';

describe('TechFingerprinterService', () => {
  let service: TechFingerprinterService;
  let httpService: jest.Mocked<HttpService>;
  let cveApi: jest.Mocked<CveApiService>;

  beforeEach(async () => {
    httpService = { get: jest.fn() } as any;
    cveApi = { queryCves: jest.fn().mockResolvedValue([]) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechFingerprinterService,
        { provide: HttpService, useValue: httpService },
        { provide: CveApiService, useValue: cveApi },
      ],
    }).compile();

    service = module.get<TechFingerprinterService>(TechFingerprinterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fingerprint', () => {
    const url = 'https://example.com';

    function mockHtmlFetch(html: string): void {
      httpService.get.mockReturnValue(of({ data: html, status: 200 }));
    }

    function mockHtmlFetchError(): void {
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(new Error('Fetch failed'))));
    }

    it('should detect Nginx from Server header', async () => {
      mockHtmlFetch('');
      const headers = { Server: 'nginx/1.22.0' };

      const result = await service.fingerprint(headers, url);

      const nginx = result.technologies.find((t) => t.name === 'Nginx');
      expect(nginx).toBeDefined();
      expect(nginx!.version).toBe('1.22.0');
      expect(nginx!.confidence).toBe('high');
    });

    it('should detect Apache from Server header', async () => {
      mockHtmlFetch('');
      const headers = { Server: 'Apache/2.4.41' };

      const result = await service.fingerprint(headers, url);

      const apache = result.technologies.find((t) => t.name === 'Apache');
      expect(apache).toBeDefined();
      expect(apache!.version).toBe('2.4.41');
      expect(apache!.confidence).toBe('high');
    });

    it('should detect PHP from X-Powered-By header', async () => {
      mockHtmlFetch('');
      const headers = { 'X-Powered-By': 'PHP/8.1.0' };

      const result = await service.fingerprint(headers, url);

      const php = result.technologies.find((t) => t.name === 'PHP');
      expect(php).toBeDefined();
      expect(php!.version).toBe('8.1.0');
      expect(php!.confidence).toBe('high');
    });

    it('should detect Express from X-Powered-By header', async () => {
      mockHtmlFetch('');
      const headers = { 'X-Powered-By': 'Express' };

      const result = await service.fingerprint(headers, url);

      const express = result.technologies.find((t) => t.name === 'Express');
      expect(express).toBeDefined();
      expect(express!.version).toBeNull();
      expect(express!.confidence).toBe('high');
    });

    it('should detect Cloudflare from cf-ray header', async () => {
      mockHtmlFetch('');
      const headers = { 'cf-ray': 'abc123' };

      const result = await service.fingerprint(headers, url);

      const cf = result.technologies.find((t) => t.name === 'Cloudflare');
      expect(cf).toBeDefined();
      expect(cf!.confidence).toBe('high');
    });

    it('should detect WordPress from HTML meta generator tag', async () => {
      const html = '<html><head><meta name="generator" content="WordPress 6.4.2"></head></html>';
      mockHtmlFetch(html);
      const headers = {};

      const result = await service.fingerprint(headers, url);

      const wp = result.technologies.find((t) => t.name === 'WordPress');
      expect(wp).toBeDefined();
      expect(wp!.version).toBe('6.4.2');
      expect(wp!.confidence).toBe('high');
    });

    it('should detect jQuery from script src containing version', async () => {
      const html = '<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>';
      mockHtmlFetch(html);
      const headers = {};

      const result = await service.fingerprint(headers, url);

      const jq = result.technologies.find((t) => t.name === 'jQuery');
      expect(jq).toBeDefined();
      expect(jq!.version).toBe('3.6.0');
      expect(jq!.confidence).toBe('medium');
    });

    it('should return technologies empty when no signatures match', async () => {
      mockHtmlFetch('<html><body>nothing here</body></html>');
      const headers = { 'x-random': 'foo' };

      const result = await service.fingerprint(headers, url);

      expect(result.technologies).toHaveLength(0);
    });

    it('should deduplicate technologies keeping highest confidence', async () => {
      // Nginx from server header (high) + jQuery from HTML (medium)
      const html = '<script src="jquery-3.6.0.min.js"></script>';
      mockHtmlFetch(html);
      // Doing jQuery detection (medium) + Server header + WordPress from both HTML and headers
      const headers = { Server: 'nginx/1.22.0' };

      const result = await service.fingerprint(headers, url);

      const nginx = result.technologies.filter((t) => t.name === 'Nginx');
      expect(nginx).toHaveLength(1);
      expect(nginx[0].confidence).toBe('high');
    });

    it('should match CVE-2023-44487 for Nginx 1.20.0', async () => {
      mockHtmlFetch('');
      cveApi.queryCves.mockResolvedValue([]);
      const headers = { Server: 'nginx/1.20.0' };

      const result = await service.fingerprint(headers, url);

      const cve = result.cves.find((c) => c.id === 'CVE-2023-44487');
      expect(cve).toBeDefined();
      expect(cve!.severity).toBe('high');
    });

    it('should match CVE-2022-31626 for PHP 7.4.0', async () => {
      mockHtmlFetch('');
      cveApi.queryCves.mockResolvedValue([]);
      const headers = { 'X-Powered-By': 'PHP/7.4.0' };

      const result = await service.fingerprint(headers, url);

      const cve = result.cves.find((c) => c.id === 'CVE-2022-31626');
      expect(cve).toBeDefined();
      expect(cve!.severity).toBe('critical');
    });

    it('should return no local CVEs for modern WordPress 6.5', async () => {
      const html = '<meta name="generator" content="WordPress 6.5">';
      mockHtmlFetch(html);
      cveApi.queryCves.mockResolvedValue([]);
      const headers = {};

      const result = await service.fingerprint(headers, url);

      const wpLocalCves = result.cves.filter((c) => c.affectedVersions === '6.5');
      expect(wpLocalCves).toHaveLength(0);
    });

    it('should merge local CVEs with OSV CVEs', async () => {
      mockHtmlFetch('');
      cveApi.queryCves.mockResolvedValue([
        { id: 'CVE-OSV-0001', description: 'OSV found this', severity: 'medium', affectedVersions: '1.20.0' },
      ]);
      const headers = { Server: 'nginx/1.20.0' };

      const result = await service.fingerprint(headers, url);

      const localCve = result.cves.find((c) => c.id === 'CVE-2023-44487');
      const osvCve = result.cves.find((c) => c.id === 'CVE-OSV-0001');
      expect(localCve).toBeDefined();
      expect(osvCve).toBeDefined();
    });

    it('should handle empty headers array and still return technologies from header-based sigs', async () => {
      mockHtmlFetch('<html><body></body></html>');

      const result = await service.fingerprint({}, url);

      expect(result.technologies).toHaveLength(0);
      expect(result.checked).toBe(true);
    });

    it('should return grade 1.0 when no CVEs found', async () => {
      mockHtmlFetch('');
      const headers = { Server: 'nginx/99.99.99' };

      const result = await service.fingerprint(headers, url);

      expect(result.grade).toBe(1.0);
    });

    it('should return grade 0.2 when critical CVEs found', async () => {
      mockHtmlFetch('');
      cveApi.queryCves.mockResolvedValue([
        { id: 'CVE-CRIT-0001', description: 'Critical OSV CVE', severity: 'critical', affectedVersions: '7.4.0' },
      ]);
      const headers = { Server: 'nginx/1.20.0' };

      const result = await service.fingerprint(headers, url);

      expect(result.grade).toBe(0.2);
    });

    it('should call httpService.get to fetch HTML and handle failure gracefully', async () => {
      mockHtmlFetchError();
      const headers = { Server: 'nginx/1.22.0' };

      const result = await service.fingerprint(headers, url);

      expect(httpService.get).toHaveBeenCalledWith(url, expect.any(Object));
      const nginx = result.technologies.find((t) => t.name === 'Nginx');
      expect(nginx).toBeDefined();
      expect(nginx!.version).toBe('1.22.0');
    });
  });
});

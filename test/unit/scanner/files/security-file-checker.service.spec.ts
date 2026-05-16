import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, Observable } from 'rxjs';
import { SecurityFileCheckerService } from '../../../../src/scanner/files/security-file-checker.service';

describe('SecurityFileCheckerService', () => {
  let service: SecurityFileCheckerService;
  let httpService: { get: jest.Mock };

  const baseUrl = 'https://example.com';

  const validSecurityTxt = `Contact: mailto:security@example.com
Expires: 2026-12-31T23:59:00.000Z
Encryption: https://example.com/pgp-key.txt
Policy: https://example.com/security-policy
`;

  const validRobotsTxt = `User-agent: *
Disallow: /cgi-bin/
Disallow: /tmp/
Sitemap: https://example.com/sitemap.xml
`;

  function mockGetResponse(status: number, data: string, extraHeaders?: Record<string, string>) {
    return of({
      status,
      data,
      headers: { 'content-type': 'text/plain', ...extraHeaders },
    });
  }

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityFileCheckerService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<SecurityFileCheckerService>(SecurityFileCheckerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('both files present with valid content returns grade near 1.0', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(200, validSecurityTxt);
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.checked).toBe(true);
    expect(result.securityTxt.present).toBe(true);
    expect(result.robotsTxt.present).toBe(true);
    expect(result.grade).toBeGreaterThanOrEqual(0.8);
  });

  it('security.txt with Contact and Expires returns grade 1.0', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(200, validSecurityTxt);
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.grade).toBe(1.0);
    expect(result.securityTxt.finding).toContain('Contact');
    expect(result.securityTxt.finding).toContain('Expires');
  });

  it('security.txt with Contact but no Expires returns grade 0.6', async () => {
    const securityTxtNoExpires = 'Contact: mailto:security@example.com\n';

    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(200, securityTxtNoExpires);
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.grade).toBe(0.6);
    expect(result.securityTxt.finding).toContain('Contact');
    expect(result.securityTxt.finding).toContain('Expires');
  });

  it('security.txt with no Contact field returns grade 0.3', async () => {
    const securityTxtNoContact = 'Expires: 2026-12-31T23:59:00.000Z\n';

    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(200, securityTxtNoContact);
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.grade).toBe(0.3);
    expect(result.securityTxt.finding).toContain('missing required Contact');
  });

  it('only security.txt present returns partial grade', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(200, validSecurityTxt);
      }
      return mockGetResponse(404, '');
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(true);
    expect(result.robotsTxt.present).toBe(false);
    expect(result.grade).toBeGreaterThan(0);
    expect(result.grade).toBeLessThan(1.0);
  });

  it('only robots.txt present returns partial grade', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(404, '');
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(false);
    expect(result.robotsTxt.present).toBe(true);
    expect(result.grade).toBeGreaterThan(0);
    expect(result.grade).toBeLessThan(1.0);
  });

  it('both absent (404) returns grade 0', async () => {
    httpService.get.mockReturnValue(mockGetResponse(404, ''));

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(false);
    expect(result.robotsTxt.present).toBe(false);
    expect(result.grade).toBe(0);
  });

  it('returns grade 0 when both absent via different non-200 statuses', async () => {
    httpService.get.mockImplementation((url: string) => {
      return mockGetResponse(500, '');
    });

    const result = await service.check(baseUrl);

    expect(result.grade).toBe(0);
  });

  it('empty file (200 but empty content) returns present=true with grade 0.3', async () => {
    httpService.get.mockImplementation((url: string) => {
      return mockGetResponse(200, '');
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(true);
    expect(result.securityTxt.grade).toBe(0.3);
    expect(result.securityTxt.finding).toContain('empty');

    expect(result.robotsTxt.present).toBe(true);
    expect(result.robotsTxt.grade).toBe(0.3);
    expect(result.robotsTxt.finding).toContain('empty');
  });

  it('403 returns present=true with grade 0.5', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(403, '');
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(true);
    expect(result.securityTxt.grade).toBe(0.5);
    expect(result.securityTxt.finding).toContain('403');
  });

  it('error handling: connection timeout returns present=false', async () => {
    const error = new Error('connect ETIMEDOUT');
    httpService.get.mockReturnValue(new Observable((sub) => { sub.error(error); }));

    const result = await service.check(baseUrl);

    expect(result.securityTxt.present).toBe(false);
    expect(result.securityTxt.statusCode).toBeNull();
    expect(result.robotsTxt.present).toBe(false);
    expect(result.robotsTxt.statusCode).toBeNull();
    expect(result.grade).toBe(0);
  });

  it('robots.txt with User-agent and Disallow returns grade 0.8', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(404, '');
      }
      return mockGetResponse(200, validRobotsTxt);
    });

    const result = await service.check(baseUrl);

    expect(result.robotsTxt.grade).toBe(0.8);
  });

  it('robots.txt without User-agent returns grade 0.2', async () => {
    const noUserAgentRobots = 'Disallow: /admin/\n';

    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(404, '');
      }
      return mockGetResponse(200, noUserAgentRobots);
    });

    const result = await service.check(baseUrl);

    expect(result.robotsTxt.grade).toBe(0.2);
    expect(result.robotsTxt.finding).toContain('User-agent');
  });

  it('robots.txt with sensitive paths in Disallow reduces grade to 0.5', async () => {
    const riskyRobots = `User-agent: *
Disallow: /admin/
Disallow: /.git/
Disallow: /backup/
`;

    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(404, '');
      }
      return mockGetResponse(200, riskyRobots);
    });

    const result = await service.check(baseUrl);

    expect(result.robotsTxt.grade).toBe(0.5);
    expect(result.robotsTxt.finding).toContain('sensitive');
  });

  it('robots.txt with Allows only and no Disallow returns grade 0.4', async () => {
    const allowOnlyRobots = `User-agent: *
Allow: /public/
`;

    httpService.get.mockImplementation((url: string) => {
      if (url.includes('security.txt')) {
        return mockGetResponse(404, '');
      }
      return mockGetResponse(200, allowOnlyRobots);
    });

    const result = await service.check(baseUrl);

    expect(result.robotsTxt.grade).toBe(0.4);
  });

  it('truncates long content to 300 characters', async () => {
    const longContent = 'A'.repeat(500);

    httpService.get.mockImplementation((url: string) => {
      return mockGetResponse(200, longContent);
    });

    const result = await service.check(baseUrl);

    expect(result.robotsTxt.content).toBe('A'.repeat(300) + '...');
  });
});

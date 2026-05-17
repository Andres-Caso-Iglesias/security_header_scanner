import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, Observable } from 'rxjs';
import { SensitiveFileCheckerService } from '../../../../src/scanner/files/sensitive-file-checker.service';

describe('SensitiveFileCheckerService', () => {
  let service: SensitiveFileCheckerService;
  let httpService: { head: jest.Mock };

  const baseUrl = 'https://example.com';

  function mockResponse(status: number, contentType: string, contentLength?: number) {
    const headers: Record<string, string> = { 'content-type': contentType };
    if (contentLength !== undefined) {
      headers['content-length'] = String(contentLength);
    }
    return of({ status, headers });
  }

  beforeEach(async () => {
    httpService = { head: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensitiveFileCheckerService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<SensitiveFileCheckerService>(SensitiveFileCheckerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns checked=true always', async () => {
    httpService.head.mockReturnValue(mockResponse(404, 'text/plain'));

    const result = await service.check(baseUrl);

    expect(result.checked).toBe(true);
  });

  it('returns exposedCount=0 and grade=1.0 when all paths return 404', async () => {
    httpService.head.mockReturnValue(mockResponse(404, 'text/plain'));

    const result = await service.check(baseUrl);

    expect(result.exposedCount).toBe(0);
    expect(result.grade).toBe(1.0);
    expect(result.files).toHaveLength(40);
  });

  it('returns exposedCount > 0 for paths returning 200 with non-HTML content', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('.env')) {
        return mockResponse(200, 'application/octet-stream', 150);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);

    expect(result.exposedCount).toBeGreaterThan(0);
    expect(result.grade).toBeLessThan(1.0);
  });

  it('HTTP 403 returns exposed=true with high confidence', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/admin/')) {
        return mockResponse(403, 'text/html');
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const adminResult = result.files.find((f) => f.path === '/admin/');

    expect(adminResult).toBeDefined();
    expect(adminResult!.exposed).toBe(true);
    expect(adminResult!.confidence).toBe('high');
    expect(adminResult!.statusCode).toBe(403);
  });

  it('HTTP 401 returns exposed=true with high confidence', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/private/')) {
        return mockResponse(401, 'text/html');
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const privateResult = result.files.find((f) => f.path === '/private/');

    expect(privateResult).toBeDefined();
    expect(privateResult!.exposed).toBe(true);
    expect(privateResult!.confidence).toBe('high');
    expect(privateResult!.statusCode).toBe(401);
  });

  it('HTTP 301/302 returns exposed=false with medium confidence', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/wp-admin/')) {
        return mockResponse(301, 'text/html');
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const redirectResult = result.files.find((f) => f.path === '/wp-admin/');

    expect(redirectResult).toBeDefined();
    expect(redirectResult!.exposed).toBe(false);
    expect(redirectResult!.confidence).toBe('medium');
  });

  it('soft 404 detection: HTML with content-length > 500 returns exposed=true, confidence=low', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/wp-config.php')) {
        return mockResponse(200, 'text/html', 2000);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const wpConfigResult = result.files.find((f) => f.path === '/wp-config.php');

    expect(wpConfigResult).toBeDefined();
    expect(wpConfigResult!.exposed).toBe(true);
    expect(wpConfigResult!.confidence).toBe('low');
    expect(wpConfigResult!.finding).toContain('soft 404');
  });

  it('non-HTML 200 (JSON) returns exposed=true, confidence=high', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('credentials.json')) {
        return mockResponse(200, 'application/json', 250);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const credResult = result.files.find((f) => f.path === '/credentials.json');

    expect(credResult).toBeDefined();
    expect(credResult!.exposed).toBe(true);
    expect(credResult!.confidence).toBe('high');
  });

  it('empty HTML (<=500 bytes) returns exposed=true, confidence=medium', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('test.php')) {
        return mockResponse(200, 'text/html', 300);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const testPhpResult = result.files.find((f) => f.path === '/test.php');

    expect(testPhpResult).toBeDefined();
    expect(testPhpResult!.exposed).toBe(true);
    expect(testPhpResult!.confidence).toBe('medium');
  });

  it('HTML 200 without content-length header returns exposed=true, confidence=low', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('info.php')) {
        return of({ status: 200, headers: { 'content-type': 'text/html' } });
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const infoPhpResult = result.files.find((f) => f.path === '/info.php');

    expect(infoPhpResult).toBeDefined();
    expect(infoPhpResult!.exposed).toBe(true);
    expect(infoPhpResult!.confidence).toBe('low');
  });

  it('HTTP 204 returns exposed=true, confidence=high', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/.git/config')) {
        return mockResponse(204, 'text/plain');
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const gitConfigResult = result.files.find((f) => f.path === '/.git/config');

    expect(gitConfigResult).toBeDefined();
    expect(gitConfigResult!.exposed).toBe(true);
    expect(gitConfigResult!.confidence).toBe('high');
    expect(gitConfigResult!.statusCode).toBe(204);
  });

  it('grade=0.7 when 1-3 paths exposed', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('.env.local') || url.includes('.env.production')) {
        return mockResponse(200, 'application/octet-stream', 50);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);

    expect(result.exposedCount).toBeGreaterThanOrEqual(1);
    expect(result.exposedCount).toBeLessThanOrEqual(3);
    expect(result.grade).toBe(0.7);
  });

  it('grade=0.4 when 4-8 paths exposed', async () => {
    httpService.head.mockImplementation((url: string) => {
      const exposedPaths = ['/.env', '/.env.local', '/.git/config', '/.git/HEAD', '/admin/'];
      if (exposedPaths.some((p) => url.includes(p))) {
        return mockResponse(200, 'application/octet-stream', 50);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);

    expect(result.exposedCount).toBeGreaterThanOrEqual(4);
    expect(result.exposedCount).toBeLessThanOrEqual(8);
    expect(result.grade).toBe(0.4);
  });

  it('grade=0.1 when 9+ paths exposed', async () => {
    httpService.head.mockImplementation((url: string) => {
      const exposedPaths = [
        '/.env', '/.env.local', '/.env.production', '/.git/config',
        '/.git/HEAD', '/admin/', '/backup/', '/config.php', '/config/',
        '/crossdomain.xml',
      ];
      if (exposedPaths.some((p) => url.includes(p))) {
        return mockResponse(200, 'application/octet-stream', 50);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);

    expect(result.exposedCount).toBeGreaterThanOrEqual(9);
    expect(result.grade).toBe(0.1);
  });

  it('each path is checked independently', async () => {
    httpService.head.mockImplementation((url: string) => {
      if (url.includes('/.gitignore')) {
        return mockResponse(200, 'text/plain', 100);
      }
      return mockResponse(404, 'text/plain');
    });

    const result = await service.check(baseUrl);
    const gitignoreResult = result.files.find((f) => f.path === '/.gitignore');

    expect(gitignoreResult).toBeDefined();
    expect(gitignoreResult!.exposed).toBe(true);

    const otherFileResult = result.files.find((f) => f.path === '/.htaccess');
    expect(otherFileResult).toBeDefined();
    expect(otherFileResult!.exposed).toBe(false);
  });

  it('connection error returns exposed=false with high confidence and null statusCode', async () => {
    const error = new Error('Connection refused');
    (error as any).code = 'ECONNREFUSED';
    httpService.head.mockReturnValue(new Observable((sub) => { sub.error(error); }));

    const result = await service.check(baseUrl);

    expect(result.files[0].exposed).toBe(false);
    expect(result.files[0].confidence).toBe('high');
    expect(result.files[0].statusCode).toBeNull();
    expect(result.files[0].finding).toContain('Connection error');
  });
});

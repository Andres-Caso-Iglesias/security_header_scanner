import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, Observable } from 'rxjs';
import { SriCheckerService } from '../../../../src/scanner/content/sri-checker.service';

describe('SriCheckerService', () => {
  let service: SriCheckerService;
  let httpService: { get: jest.Mock };

  const testUrl = 'https://example.com';

  function mockHtmlResponse(html: string) {
    return of({ status: 200, data: html, headers: { 'content-type': 'text/html' } });
  }

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SriCheckerService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<SriCheckerService>(SriCheckerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns checked=true always', async () => {
    httpService.get.mockReturnValue(mockHtmlResponse('<html></html>'));

    const result = await service.check(testUrl);

    expect(result.checked).toBe(true);
  });

  it('returns grade=1.0 when all external resources have integrity attributes', async () => {
    const html = `<html>
<head>
  <script src="https://cdn.example.com/lib.js" integrity="sha256-abc123"></script>
  <link rel="stylesheet" href="https://cdn.example.com/style.css" integrity="sha384-def456">
</head>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.grade).toBe(1.0);
    expect(result.secureResources).toBe(2);
    expect(result.insecureResources).toHaveLength(0);
    expect(result.finding).toContain('All');
  });

  it('returns grade=0 when no external resources have integrity', async () => {
    const html = `<html>
<head>
  <script src="https://cdn.example.com/lib.js"></script>
  <link rel="stylesheet" href="https://cdn.example.com/style.css">
</head>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.grade).toBe(0);
    expect(result.secureResources).toBe(0);
    expect(result.insecureResources).toHaveLength(2);
  });

  it('returns grade between 0 and 1 for mixed results', async () => {
    const html = `<html>
<head>
  <script src="https://cdn.example.com/lib.js" integrity="sha256-abc123"></script>
  <script src="https://cdn.example.com/analytics.js"></script>
  <link rel="stylesheet" href="https://cdn.example.com/style.css" integrity="sha384-def456">
  <link rel="stylesheet" href="https://cdn.example.com/theme.css">
</head>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.grade).toBe(0.5);
    expect(result.secureResources).toBe(2);
    expect(result.insecureResources).toHaveLength(2);
  });

  it('handles empty HTML gracefully - grade 1.0', async () => {
    httpService.get.mockReturnValue(mockHtmlResponse('<html></html>'));

    const result = await service.check(testUrl);

    expect(result.grade).toBe(1.0);
    expect(result.totalResources).toBe(0);
    expect(result.finding).toBe('No external scripts or stylesheets detected');
  });

  it('handles HTML with no script or link tags - grade 1.0', async () => {
    const html = '<html><body><p>Hello</p></body></html>';

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.grade).toBe(1.0);
    expect(result.totalResources).toBe(0);
  });

  it('detects script tags with integrity', async () => {
    const html = `<html>
  <script src="https://cdn.example.com/secure.js" integrity="sha256-xyz"></script>
  <script src="https://cdn.example.com/insecure.js"></script>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    const secureScript = result.insecureResources.find((r) => r.src === 'https://cdn.example.com/secure.js');
    const insecureScript = result.insecureResources.find((r) => r.src === 'https://cdn.example.com/insecure.js');

    expect(secureScript).toBeUndefined();

    expect(insecureScript).toBeDefined();
    expect(insecureScript!.tag).toBe('script');
    expect(insecureScript!.hasIntegrity).toBe(false);
  });

  it('detects link stylesheet tags with integrity', async () => {
    const html = `<html>
  <link rel="stylesheet" href="https://cdn.example.com/secure.css" integrity="sha256-abc">
  <link rel="stylesheet" href="https://cdn.example.com/insecure.css">
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    const secureLink = result.insecureResources.find((r) => r.src === 'https://cdn.example.com/secure.css');
    const insecureLink = result.insecureResources.find((r) => r.src === 'https://cdn.example.com/insecure.css');

    expect(secureLink).toBeUndefined();

    expect(insecureLink).toBeDefined();
    expect(insecureLink!.tag).toBe('link');
    expect(insecureLink!.hasIntegrity).toBe(false);
  });

  it('handles self-hosted resources same as external - included in count', async () => {
    const html = `<html>
  <script src="/js/app.js"></script>
  <script src="https://cdn.example.com/lib.js" integrity="sha256-xyz"></script>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.totalResources).toBe(2);
    expect(result.secureResources).toBe(1);
    expect(result.insecureResources).toHaveLength(1);
    expect(result.insecureResources[0].src).toBe('/js/app.js');
    expect(result.grade).toBe(0.5);
  });

  it('detects link with href before rel attribute (alternate order)', async () => {
    const html = `<html>
  <link href="https://cdn.example.com/style.css" rel="stylesheet">
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.totalResources).toBe(1);
    expect(result.insecureResources).toHaveLength(1);
    expect(result.insecureResources[0].src).toBe('https://cdn.example.com/style.css');
  });

  it('deduplicates resources with same src', async () => {
    const html = `<html>
  <script src="https://cdn.example.com/lib.js"></script>
  <script src="https://cdn.example.com/lib.js"></script>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.totalResources).toBe(1);
    expect(result.insecureResources).toHaveLength(1);
  });

  it('fetch failure returns error state gracefully', async () => {
    const error = new Error('getaddrinfo ENOTFOUND example.com');
    httpService.get.mockReturnValue(new Observable((sub) => { sub.error(error); }));

    const result = await service.check(testUrl);

    expect(result.checked).toBe(true);
    expect(result.grade).toBe(0);
    expect(result.finding).toContain('Could not fetch');
    expect(result.recommendation).toBe('Verify the URL is accessible and returns HTML');
  });

  it('returns finding and recommendation text when some resources lack integrity', async () => {
    const html = `<html>
  <script src="https://cdn.example.com/lib.js" integrity="sha256-abc"></script>
  <script src="https://cdn.example.com/analytics.js"></script>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.finding).toContain('1 of 2');
    expect(result.finding).toContain('lack SRI');
    expect(result.recommendation).toContain('analytics.js');
  });

  it('returns finding and recommendation text when all resources are secure', async () => {
    const html = `<html>
  <script src="https://cdn.example.com/lib.js" integrity="sha256-abc"></script>
</html>`;

    httpService.get.mockReturnValue(mockHtmlResponse(html));

    const result = await service.check(testUrl);

    expect(result.finding).toContain('All');
    expect(result.recommendation).toBe('SRI is properly configured');
  });
});

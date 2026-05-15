import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { SensitiveFilesInfo, SensitiveFileResult } from '../../common/interfaces/content-info.interface';
import { TIMEOUTS } from '../../common/constants/timeout.config';

@Injectable()
export class SensitiveFileCheckerService {
  private readonly logger = new Logger(SensitiveFileCheckerService.name);

  private readonly sensitivePaths = [
    '/.env',
    '/.env.local',
    '/.env.production',
    '/.git/config',
    '/.git/HEAD',
    '/.gitignore',
    '/admin/',
    '/backup/',
    '/config.php',
    '/config/',
    '/crossdomain.xml',
    '/database.yml',
    '/db/',
    '/debug.log',
    '/error.log',
    '/htaccess.txt',
    '/info.php',
    '/install/',
    '/logs/',
    '/phpinfo.php',
    '/phpinfo',
    '/private/',
    '/robots.txt',
    '/server-status',
    '/test.php',
    '/wp-admin/',
    '/wp-config.php',
    '/wp-content/',
    '/web.config',
    '/.htaccess',
    '/.htpasswd',
    '/credentials.json',
    '/.aws/credentials',
    '/.npmrc',
    '/.ssh/',
    '/Dockerfile',
    '/docker-compose.yml',
    '/Makefile',
    '/composer.json',
    '/package.json',
  ];

  constructor(private readonly httpService: HttpService) {}

  async check(baseUrl: string): Promise<SensitiveFilesInfo> {
    const base = baseUrl.replace(/\/+$/, '');
    const results: SensitiveFileResult[] = [];
    const concurrency = 5;

    for (let i = 0; i < this.sensitivePaths.length; i += concurrency) {
      const batch = this.sensitivePaths.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((path) => this.checkSingle(base, path)),
      );
      results.push(...batchResults);
    }

    const exposed = results.filter((r) => r.exposed);
    const grade = exposed.length === 0 ? 1.0
      : exposed.length <= 3 ? 0.7
      : exposed.length <= 8 ? 0.4
      : 0.1;

    return {
      checked: true,
      files: results,
      exposedCount: exposed.length,
      grade,
    };
  }

  private async checkSingle(baseUrl: string, path: string): Promise<SensitiveFileResult> {
    const url = `${baseUrl}${path}`;
    try {
      const response = await firstValueFrom(
        this.httpService.head(url, {
          timeout: TIMEOUTS.SENSITIVE_FILE,
          maxRedirects: 3,
          validateStatus: () => true,
          headers: { 'User-Agent': 'AuditoriaWeb-Scanner/1.0' },
        }),
      );

      const status = response.status;
      const contentType = (response.headers['content-type'] || '') as string;
      const contentLength = parseInt(response.headers['content-length'] as string, 10);

      if (status === 200 || status === 204) {
        // Check for soft 404s: 200 with HTML content and significant size suggests a custom error page
        const isHtml = contentType.includes('text/html');
        const isLargeHtml = isHtml && (!isNaN(contentLength) && contentLength > 500);

        if (isLargeHtml || (isHtml && isNaN(contentLength))) {
          return {
            path,
            statusCode: status,
            exposed: true,
            confidence: 'low',
            finding: `Suspected soft 404 (HTTP ${status}, HTML response) — verify manually`,
          };
        }

        // Non-HTML content (JSON, plain text, etc.) is likely a real exposure
        if (isHtml && !isNaN(contentLength) && contentLength <= 500) {
          return {
            path,
            statusCode: status,
            exposed: true,
            confidence: 'medium',
            finding: `Exposed (HTTP ${status}, small HTML — could be a simple page)`,
          };
        }

        return {
          path,
          statusCode: status,
          exposed: true,
          confidence: 'high',
          finding: `Exposed (HTTP ${status})`,
        };
      }

      if (status === 403 || status === 401) {
        return {
          path,
          statusCode: status,
          exposed: true,
          confidence: 'high',
          finding: `Access restricted (HTTP ${status}) — may exist but blocked`,
        };
      }

      if (status === 301 || status === 302 || status === 307 || status === 308) {
        return {
          path,
          statusCode: status,
          exposed: false,
          confidence: 'medium',
          finding: `Redirect (HTTP ${status})`,
        };
      }

      return {
        path,
        statusCode: status,
        exposed: false,
        confidence: 'high',
        finding: `Not found (HTTP ${status})`,
      };
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
        this.logger.warn(`Connection error checking ${url}: ${err.message}`);
        return { path, statusCode: null, exposed: false, confidence: 'high', finding: `Connection error: ${err.message}` };
      }
      return { path, statusCode: err.status ?? null, exposed: false, confidence: 'high', finding: `Error: ${err.message}` };
    }
  }
}

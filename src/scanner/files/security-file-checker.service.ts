import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { SecurityFileInfo, SecurityFileCheck } from '../../common/interfaces/security-file-info.interface';
import { TIMEOUTS } from '../../common/constants/timeout.config';
import { resolveAndCheckHostname } from '../../common/guards/ssrf.guard';

@Injectable()
export class SecurityFileCheckerService {
  private readonly logger = new Logger(SecurityFileCheckerService.name);

  constructor(private readonly httpService: HttpService) {}

  async check(baseUrl: string): Promise<SecurityFileInfo> {
    try {
      const parsedUrl = new URL(baseUrl);
      await resolveAndCheckHostname(parsedUrl.hostname);
    } catch (error) {
      this.logger.warn(`SSRF check failed for ${baseUrl}: ${(error as Error).message}`);
      return {
        checked: true,
        securityTxt: {
          path: '/.well-known/security.txt',
          present: false,
          statusCode: null,
          content: null,
          grade: 0,
          finding: `SSRF protection blocked: ${(error as Error).message}`,
          recommendation: 'Use a publicly accessible URL',
        },
        robotsTxt: {
          path: '/robots.txt',
          present: false,
          statusCode: null,
          content: null,
          grade: 0,
          finding: 'Skipped due to SSRF protection',
          recommendation: 'Use a publicly accessible URL',
        },
        grade: 0,
      };
    }

    const base = baseUrl.replace(/\/+$/, '');
    const [securityTxt, robotsTxt] = await Promise.all([
      this.checkSingle(`${base}/.well-known/security.txt`),
      this.checkSingle(`${base}/robots.txt`),
    ]);

    const grade = Math.round(((securityTxt.grade + robotsTxt.grade) / 2) * 100) / 100;

    return { checked: true, securityTxt, robotsTxt, grade };
  }

  private async checkSingle(url: string): Promise<SecurityFileCheck> {
    const path = new URL(url).pathname;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: TIMEOUTS.SECURITY_FILE,
          maxRedirects: 3,
          responseType: 'text',
          validateStatus: () => true,
          headers: { 'User-Agent': 'AuditoriaWeb-Scanner/1.0' },
        }),
      );

      const status = response.status;
      const content = typeof response.data === 'string' ? response.data : '';

      if (status === 200 && content.length > 0) {
        return this.analyzeFound(path, url, content);
      }

      if (status === 200 && content.length === 0) {
        return {
          path,
          present: true,
          statusCode: status,
          content: null,
          grade: 0.3,
          finding: `${path} exists but is empty`,
          recommendation: `Add proper content to ${path}`,
        };
      }

      if (status === 403 || status === 401) {
        return {
          path,
          present: true,
          statusCode: status,
          content: null,
          grade: 0.5,
          finding: `${path} exists but access is restricted (HTTP ${status})`,
          recommendation: `Review access controls for ${path}`,
        };
      }

      return {
        path,
        present: false,
        statusCode: status,
        content: null,
        grade: 0,
        finding: `${path} not found (HTTP ${status})`,
        recommendation: path.includes('security.txt')
          ? 'Add a security.txt file at /.well-known/security.txt per RFC 9116 to provide a vulnerability disclosure policy'
          : 'Consider adding a robots.txt file to manage crawler access',
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch ${url}: ${(error as Error).message}`);
      return {
        path,
        present: false,
        statusCode: null,
        content: null,
        grade: 0,
        finding: `Could not fetch ${path}: ${(error as Error).message}`,
        recommendation: 'Verify the URL is accessible',
      };
    }
  }

  private analyzeFound(path: string, url: string, content: string): SecurityFileCheck {
    if (path.includes('security.txt')) {
      return this.analyzeSecurityTxt(content);
    }
    return this.analyzeRobotsTxt(content);
  }

  private analyzeSecurityTxt(content: string): SecurityFileCheck {
    const hasContact = /^contact:/im.test(content);
    const hasExpires = /^expires:/im.test(content);
    const hasEncryption = /^encryption:/im.test(content);
    const hasPolicy = /^policy:/im.test(content);
    const hasHire = /^hiring:/im.test(content);

    const fields: string[] = [];
    if (hasContact) fields.push('Contact');
    if (hasExpires) fields.push('Expires');
    if (hasEncryption) fields.push('Encryption');
    if (hasPolicy) fields.push('Policy');

    let grade: number;
    let finding: string;
    let recommendation: string;

    if (hasContact && hasExpires) {
      grade = 1.0;
      finding = `security.txt found with required fields: ${fields.join(', ')}`;
      recommendation = 'security.txt is properly configured per RFC 9116';
    } else if (hasContact) {
      grade = 0.6;
      finding = `security.txt found with Contact field but missing Expires. Fields found: ${fields.join(', ') || 'none'}`;
      recommendation = 'Add Expires field to meet RFC 9116 requirements';
    } else {
      grade = 0.3;
      finding = 'security.txt found but missing required Contact field';
      recommendation = 'Add a Contact field with a URI or email for vulnerability reports per RFC 9116';
    }

    return {
      path: '/.well-known/security.txt',
      present: true,
      statusCode: 200,
      content: content.length > 300 ? content.substring(0, 300) + '...' : content,
      grade,
      finding,
      recommendation,
    };
  }

  private analyzeRobotsTxt(content: string): SecurityFileCheck {
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const disallows = lines.filter((l) => /^disallow:/i.test(l));
    const allows = lines.filter((l) => /^allow:/i.test(l));
    const sitemaps = lines.filter((l) => /^sitemap:/i.test(l));
    const hasUserAgent = lines.some((l) => /^user-agent:/i.test(l));

    // Check for potentially sensitive paths in Disallow
    const sensitivePatterns = [/admin/i, /wp-admin/i, /backup/i, /config/i, /\.git/i, /\.env/i, /private/i, /internal/i];
    const sensitiveFound = disallows.filter((d) => sensitivePatterns.some((p) => p.test(d)));

    let grade: number;
    let finding: string;
    let recommendation: string;

    if (!hasUserAgent) {
      grade = 0.2;
      finding = 'robots.txt exists but has no User-agent directive';
      recommendation = 'Add proper User-agent and Disallow directives';
    } else if (disallows.length === 0) {
      grade = 0.4;
      finding = 'robots.txt exists but allows all crawlers (no Disallow directives)';
      recommendation = 'Review and add Disallow directives for sensitive paths if needed';
    } else {
      grade = 0.8;
      finding = `robots.txt found with ${disallows.length} Disallow directive(s)`;
      if (sensitiveFound.length > 0) {
        grade = 0.5;
        finding += `. Potential sensitive paths exposed: ${sensitiveFound.map((d) => d.replace(/^disallow:\s*/i, '/')).join(', ')}`;
        recommendation = 'Review exposed paths in robots.txt. Consider removing entries that reveal sensitive directories.';
      } else {
        recommendation = 'robots.txt is properly configured';
      }
    }

    if (sitemaps.length > 0) {
      finding += `. Sitemap${sitemaps.length > 1 ? 's' : ''}: ${sitemaps.map((s) => s.replace(/^sitemap:\s*/i, '')).join(', ')}`;
    }

    return {
      path: '/robots.txt',
      present: true,
      statusCode: 200,
      content: content.length > 300 ? content.substring(0, 300) + '...' : content,
      grade,
      finding,
      recommendation,
    };
  }
}

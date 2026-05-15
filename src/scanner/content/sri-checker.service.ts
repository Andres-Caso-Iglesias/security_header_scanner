import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { SriInfo, SriResource } from '../../common/interfaces/content-info.interface';
import { TIMEOUTS } from '../../common/constants/timeout.config';

@Injectable()
export class SriCheckerService {
  private readonly logger = new Logger(SriCheckerService.name);

  constructor(private readonly httpService: HttpService) {}

  async check(url: string): Promise<SriInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: TIMEOUTS.SRI,
          maxRedirects: 5,
          responseType: 'text',
          validateStatus: (s) => s === 200,
          headers: { 'User-Agent': 'AuditoriaWeb-Scanner/1.0', 'Accept': 'text/html' },
        }),
      );

      const html: string = typeof response.data === 'string' ? response.data : '';
      const resources = this.parseResources(html);

      if (resources.length === 0) {
        return {
          checked: true,
          totalResources: 0,
          secureResources: 0,
          insecureResources: [],
          grade: 1.0,
          finding: 'No external scripts or stylesheets detected',
          recommendation: 'No action needed',
        };
      }

      const secure = resources.filter((r) => r.hasIntegrity);
      const insecure = resources.filter((r) => !r.hasIntegrity);
      const grade = resources.length > 0 ? Math.round((secure.length / resources.length) * 100) / 100 : 1.0;

      let finding: string;
      let recommendation: string;

      if (insecure.length === 0) {
        finding = `All ${resources.length} external resource(s) have Subresource Integrity (SRI)`;
        recommendation = 'SRI is properly configured';
      } else {
        finding = `${insecure.length} of ${resources.length} external resource(s) lack SRI (${Math.round((insecure.length / resources.length) * 100)}% unprotected)`;
        recommendation = insecure.length > 0
          ? `Add integrity attributes to: ${insecure.map((r) => r.src).join(', ')}`
          : 'Consider adding SRI to all external resources for protection against CDN compromise';
      }

      return {
        checked: true,
        totalResources: resources.length,
        secureResources: secure.length,
        insecureResources: insecure,
        grade,
        finding,
        recommendation,
      };
    } catch (error) {
      this.logger.warn(`SRI check failed for ${url}: ${(error as Error).message}`);
      return {
        checked: true,
        totalResources: 0,
        secureResources: 0,
        insecureResources: [],
        grade: 0,
        finding: `Could not fetch HTML content: ${(error as Error).message}`,
        recommendation: 'Verify the URL is accessible and returns HTML',
      };
    }
  }

  private parseResources(html: string): SriResource[] {
    const resources: SriResource[] = [];
    const seen = new Set<string>();

    // Match <script src="...">
    const scriptRegex = /<script[^>]*\s+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[1];
      if (seen.has(src)) continue;
      seen.add(src);
      const fullTag = match[0];
      resources.push({
        tag: 'script',
        src,
        hasIntegrity: /\sintegrity\s*=\s*["']/.test(fullTag),
      });
    }

    // Match <link rel="stylesheet" href="...">
    const linkRegex = /<link[^>]*\s+rel\s*=\s*["']stylesheet["'][^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (seen.has(href)) continue;
      seen.add(href);
      const fullTag = match[0];
      resources.push({
        tag: 'link',
        src: href,
        hasIntegrity: /\sintegrity\s*=\s*["']/.test(fullTag),
      });
    }

    // Also match href before rel for stylesheets
    const linkAltRegex = /<link[^>]*\s+href\s*=\s*["']([^"']+)["'][^>]*\s+rel\s*=\s*["']stylesheet["'][^>]*>/gi;
    while ((match = linkAltRegex.exec(html)) !== null) {
      const href = match[1];
      if (seen.has(href)) continue;
      seen.add(href);
      const fullTag = match[0];
      resources.push({
        tag: 'link',
        src: href,
        hasIntegrity: /\sintegrity\s*=\s*["']/.test(fullTag),
      });
    }

    return resources;
  }
}

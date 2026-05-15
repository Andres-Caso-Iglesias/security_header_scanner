import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { DetectedTech, CveInfo, TechFingerprintInfo } from '../../common/interfaces/fingerprint-info.interface';

interface TechSignature {
  name: string;
  category: DetectedTech['category'];
  detect: (headers: Record<string, string>, html: string, bodyStart: string) => DetectedTech | null;
}

interface CveRecord {
  tech: string;
  versionRange: (v: string) => boolean;
  id: string;
  description: string;
  severity: CveInfo['severity'];
}

@Injectable()
export class TechFingerprinterService {
  private readonly logger = new Logger(TechFingerprinterService.name);
  private readonly signatures: TechSignature[];
  private readonly cveDb: CveRecord[];

  constructor(private readonly httpService: HttpService) {
    this.signatures = this.buildSignatures();
    this.cveDb = this.buildCveDb();
  }

  async fingerprint(headers: Record<string, string>, url: string): Promise<TechFingerprintInfo> {
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) normalized[k.toLowerCase()] = v;

    let html = '';
    let bodyStart = '';

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 8000, maxRedirects: 3, responseType: 'text',
          validateStatus: (s) => s === 200,
          headers: { 'User-Agent': 'AuditoriaWeb-Scanner/1.0', 'Accept': 'text/html' },
        }),
      );
      html = typeof response.data === 'string' ? response.data : '';
      bodyStart = html.substring(0, 2000);
    } catch {
      // HTML fetch is best-effort, continue with headers only
    }

    const technologies: DetectedTech[] = [];
    for (const sig of this.signatures) {
      const result = sig.detect(normalized, html, bodyStart);
      if (result) technologies.push(result);
    }

    // Deduplicate: keep highest confidence for same tech
    const deduped = this.deduplicate(technologies);

    // Match CVEs
    const cves: CveInfo[] = [];
    for (const tech of deduped) {
      if (!tech.version) continue;
      for (const cve of this.cveDb) {
        if (cve.tech.toLowerCase() === tech.name.toLowerCase() && cve.versionRange(tech.version)) {
          cves.push({ id: cve.id, description: cve.description, severity: cve.severity, affectedVersions: tech.version });
        }
      }
    }

    const grade = cves.length === 0 ? 1.0 : cves.some((c) => c.severity === 'critical') ? 0.2 : cves.some((c) => c.severity === 'high') ? 0.4 : 0.6;
    const techNames = deduped.map((t) => `${t.name}${t.version ? ` ${t.version}` : ''}`).join(', ');
    const summary = deduped.length > 0
      ? `Detected: ${techNames}${cves.length > 0 ? `. ${cves.length} CVE(s) found` : ''}`
      : 'No specific technologies detected beyond basic server info';

    return { checked: true, technologies: deduped, cves, grade, summary };
  }

  private deduplicate(techs: DetectedTech[]): DetectedTech[] {
    const map = new Map<string, DetectedTech>();
    for (const t of techs) {
      const key = t.name.toLowerCase();
      const existing = map.get(key);
      if (!existing || this.confidenceWeight(t.confidence) > this.confidenceWeight(existing.confidence)) {
        map.set(key, t);
      }
    }
    return Array.from(map.values());
  }

  private confidenceWeight(c: DetectedTech['confidence']): number {
    return c === 'high' ? 3 : c === 'medium' ? 2 : 1;
  }

  // ================================================================
  // SIGNATURE DATABASE
  // ================================================================
  private buildSignatures(): TechSignature[] {
    return [
      // -- WordPress --
      {
        name: 'WordPress', category: 'cms',
        detect: (h, html, body) => {
          const evidence: string[] = [];
          const genMatch = html.match(/<meta\s+name=["']generator["'][^>]*content=["']WordPress\s*([\d.]+)?["']/i);
          if (genMatch) {
            evidence.push(`Meta generator: WordPress ${genMatch[1] || ''}`);
            return { name: 'WordPress', version: genMatch[1] || null, category: 'cms', confidence: 'high', evidence };
          }
          if (/\/wp-content\//i.test(html)) evidence.push('wp-content path');
          if (/\/wp-includes\//i.test(html)) evidence.push('wp-includes path');
          if (/\bwp-json\b/i.test(html)) evidence.push('WP REST API');
          if (h['link']?.includes('wp-json')) evidence.push('Link header wp-json');
          if (evidence.length >= 2) return { name: 'WordPress', version: null, category: 'cms', confidence: 'high', evidence };
          if (evidence.length === 1) return { name: 'WordPress', version: null, category: 'cms', confidence: 'medium', evidence };
          return null;
        },
      },
      // -- Joomla --
      {
        name: 'Joomla', category: 'cms',
        detect: (h, html) => {
          const genMatch = html.match(/<meta\s+name=["']generator["'][^>]*content=["']Joomla!\s*([\d.]+)?["']/i);
          if (genMatch) return { name: 'Joomla', version: genMatch[1] || null, category: 'cms', confidence: 'high', evidence: [`Meta generator: Joomla! ${genMatch[1] || ''}`] };
          if (/\/components\/com_/i.test(html) || /\/modules\/mod_/i.test(html)) return { name: 'Joomla', version: null, category: 'cms', confidence: 'medium', evidence: ['Joomla component/module paths'] };
          return null;
        },
      },
      // -- Drupal --
      {
        name: 'Drupal', category: 'cms',
        detect: (h, html) => {
          const genMatch = html.match(/<meta\s+name=["']generator["'][^>]*content=["']Drupal\s*([\d.]+)?["']/i);
          if (genMatch) return { name: 'Drupal', version: genMatch[1] || null, category: 'cms', confidence: 'high', evidence: [`Meta generator: Drupal ${genMatch[1] || ''}`] };
          if (/\/sites\/default\//i.test(html) || /\/core\/themes\//i.test(html) || /drupal\.js/i.test(html)) return { name: 'Drupal', version: null, category: 'cms', confidence: 'medium', evidence: ['Drupal paths detected'] };
          return null;
        },
      },
      // -- PHP --
      {
        name: 'PHP', category: 'runtime',
        detect: (h) => {
          const xpb = h['x-powered-by'];
          if (xpb) {
            const m = xpb.match(/PHP\/([\d.]+)/i);
            if (m) return { name: 'PHP', version: m[1], category: 'runtime', confidence: 'high', evidence: [`X-Powered-By: PHP/${m[1]}`] };
            return { name: 'PHP', version: null, category: 'runtime', confidence: 'high', evidence: ['X-Powered-By header'] };
          }
          return null;
        },
      },
      // -- Express/Node.js --
      {
        name: 'Express', category: 'framework',
        detect: (h) => {
          const xpb = h['x-powered-by'];
          if (xpb && /express/i.test(xpb)) return { name: 'Express', version: null, category: 'framework', confidence: 'high', evidence: ['X-Powered-By: Express'] };
          return null;
        },
      },
      // -- ASP.NET --
      {
        name: 'ASP.NET', category: 'framework',
        detect: (h) => {
          const evidence: string[] = [];
          if (h['x-aspnet-version']) evidence.push(`X-AspNet-Version: ${h['x-aspnet-version']}`);
          if (h['x-powered-by'] && /asp\.net/i.test(h['x-powered-by'])) evidence.push('X-Powered-By: ASP.NET');
          if (h['set-cookie'] && /asp\.net/i.test(h['set-cookie'])) evidence.push('ASP.NET session cookie');
          if (evidence.length > 0) return { name: 'ASP.NET', version: h['x-aspnet-version'] || null, category: 'framework', confidence: 'high', evidence };
          return null;
        },
      },
      // -- Laravel --
      {
        name: 'Laravel', category: 'framework',
        detect: (h) => {
          if (h['x-powered-by'] && /laravel/i.test(h['x-powered-by'])) return { name: 'Laravel', version: null, category: 'framework', confidence: 'high', evidence: ['X-Powered-By: Laravel'] };
          return null;
        },
      },
      // -- Django --
      {
        name: 'Django', category: 'framework',
        detect: (h) => {
          if (h['x-powered-by'] && /django/i.test(h['x-powered-by'])) return { name: 'Django', version: null, category: 'framework', confidence: 'high', evidence: ['X-Powered-By: Django'] };
          if (h['server'] && /wsgi/i.test(h['server'])) return { name: 'Django', version: null, category: 'framework', confidence: 'low', evidence: ['WSGI server'] };
          return null;
        },
      },
      // -- Nginx --
      {
        name: 'Nginx', category: 'server',
        detect: (h) => {
          if (h['server']) {
            const m = h['server'].match(/nginx\/([\d.]+)/i);
            if (m) return { name: 'Nginx', version: m[1], category: 'server', confidence: 'high', evidence: [`Server: nginx/${m[1]}`] };
            if (/nginx/i.test(h['server'])) return { name: 'Nginx', version: null, category: 'server', confidence: 'high', evidence: ['Server: nginx'] };
          }
          return null;
        },
      },
      // -- Apache --
      {
        name: 'Apache', category: 'server',
        detect: (h) => {
          if (h['server']) {
            const m = h['server'].match(/Apache\/([\d.]+)/i);
            if (m) return { name: 'Apache', version: m[1], category: 'server', confidence: 'high', evidence: [`Server: Apache/${m[1]}`] };
            if (/apache/i.test(h['server'])) return { name: 'Apache', version: null, category: 'server', confidence: 'high', evidence: ['Server: Apache'] };
          }
          return null;
        },
      },
      // -- Cloudflare --
      {
        name: 'Cloudflare', category: 'cdn',
        detect: (h) => {
          if (h['cf-ray'] || h['cf-cache-status'] || (h['server'] && /cloudflare/i.test(h['server']))) {
            return { name: 'Cloudflare', version: null, category: 'cdn', confidence: 'high', evidence: ['Cloudflare headers detected'] };
          }
          return null;
        },
      },
      // -- jQuery (from HTML) --
      {
        name: 'jQuery', category: 'framework',
        detect: (_, html) => {
          const m = html.match(/jquery[.\/-](\d+\.\d+\.\d+)/i);
          if (m) return { name: 'jQuery', version: m[1], category: 'framework', confidence: 'medium', evidence: [`jQuery ${m[1]} in script src`] };
          if (/jquery/i.test(html)) return { name: 'jQuery', version: null, category: 'framework', confidence: 'low', evidence: ['jQuery referenced'] };
          return null;
        },
      },
      // -- Bootstrap --
      {
        name: 'Bootstrap', category: 'framework',
        detect: (_, html) => {
          const m = html.match(/bootstrap[.\/-](\d+\.\d+\.\d+)/i);
          if (m) return { name: 'Bootstrap', version: m[1], category: 'framework', confidence: 'medium', evidence: [`Bootstrap ${m[1]} in stylesheet`] };
          if (/bootstrap/i.test(html)) return { name: 'Bootstrap', version: null, category: 'framework', confidence: 'low', evidence: ['Bootstrap referenced'] };
          return null;
        },
      },
      // -- Google Analytics --
      {
        name: 'Google Analytics', category: 'cms',
        detect: (_, html) => {
          if (/gtag\s*\(|google-analytics\.com|ga\s*\(['"]create['"]/i.test(html)) return { name: 'Google Analytics', version: null, category: 'cms', confidence: 'medium', evidence: ['Google Analytics detected'] };
          return null;
        },
      },
      // -- Vite --
      {
        name: 'Vite', category: 'cms',
        detect: (_, html) => {
          const m = html.match(/<script\s+type=["']module["'][^>]*src=["'][^"']*\/@vite\/([^"']+)/i);
          if (m) return { name: 'Vite', version: null, category: 'cms', confidence: 'high', evidence: ['Vite module script detected'] };
          return null;
        },
      },
      // -- Webpack --
      {
        name: 'Webpack', category: 'cms',
        detect: (_, html) => {
          // Webpack bundles typically have [name].[hash].js pattern
          const m = html.match(/<script[^>]*src=["'][^"']*\/(\w+)\.([a-f0-9]{8,20})\.js["']/i);
          if (m) return { name: 'Webpack', version: null, category: 'cms', confidence: 'medium', evidence: [`Webpack chunked bundle: ${m[1]}.${m[2].substring(0, 8)}...js`] };
          return null;
        },
      },
      // -- Next.js --
      {
        name: 'Next.js', category: 'cms',
        detect: (h, html) => {
          if (/__NEXT_DATA__/i.test(html)) return { name: 'Next.js', version: null, category: 'cms', confidence: 'high', evidence: ['__NEXT_DATA__ script detected'] };
          if (h['x-nextjs-page'] || h['x-middleware-rewrite']) return { name: 'Next.js', version: null, category: 'cms', confidence: 'high', evidence: ['Next.js headers detected'] };
          if (h['x-powered-by'] && /next\.js/i.test(h['x-powered-by'])) return { name: 'Next.js', version: null, category: 'cms', confidence: 'high', evidence: [`X-Powered-By: ${h['x-powered-by']}`] };
          return null;
        },
      },
      // -- Nuxt.js --
      {
        name: 'Nuxt.js', category: 'cms',
        detect: (_, html) => {
          if (/__NUXT__/i.test(html)) return { name: 'Nuxt.js', version: null, category: 'cms', confidence: 'high', evidence: ['__NUXT__ script detected'] };
          return null;
        },
      },
      // -- Ruby on Rails --
      {
        name: 'Ruby on Rails', category: 'framework',
        detect: (h) => {
          const evidence: string[] = [];
          if (h['x-rack-cache']) evidence.push(`X-Rack-Cache: ${h['x-rack-cache']}`);
          if (h['x-runtime']) evidence.push(`X-Runtime: ${h['x-runtime']}`);
          if (h['set-cookie'] && /_session_id/i.test(h['set-cookie'])) evidence.push('Rails session cookie');
          if (h['x-powered-by'] && /rails/i.test(h['x-powered-by'])) evidence.push(`X-Powered-By: ${h['x-powered-by']}`);
          if (evidence.length > 0) return { name: 'Ruby on Rails', version: null, category: 'framework', confidence: evidence.length >= 2 ? 'high' : 'medium', evidence };
          return null;
        },
      },
      // -- Tomcat --
      {
        name: 'Tomcat', category: 'server',
        detect: (h) => {
          if (h['server'] && /apache-coyote/i.test(h['server'])) return { name: 'Tomcat', version: null, category: 'server', confidence: 'high', evidence: [`Server: ${h['server']}`] };
          return null;
        },
      },
      // -- IIS --
      {
        name: 'IIS', category: 'server',
        detect: (h) => {
          const evidence: string[] = [];
          if (h['server'] && /microsoft-iis\/([\d.]+)/i.test(h['server'])) {
            const m = h['server'].match(/microsoft-iis\/([\d.]+)/i);
            return { name: 'IIS', version: m?.[1] || null, category: 'server', confidence: 'high', evidence: [`Server: ${h['server']}`] };
          }
          if (h['x-aspnet-version']) evidence.push(`X-AspNet-Version: ${h['x-aspnet-version']}`);
          if (h['x-powered-by'] && /asp\.net/i.test(h['x-powered-by'])) evidence.push(`X-Powered-By: ${h['x-powered-by']}`);
          if (evidence.length > 0) return { name: 'IIS', version: null, category: 'server', confidence: 'high', evidence };
          return null;
        },
      },
      // -- Gunicorn --
      {
        name: 'Gunicorn', category: 'server',
        detect: (h) => {
          if (h['server'] && /gunicorn/i.test(h['server'])) return { name: 'Gunicorn', version: null, category: 'server', confidence: 'high', evidence: [`Server: ${h['server']}`] };
          return null;
        },
      },
      // -- Node.js (generic) --
      {
        name: 'Node.js', category: 'runtime',
        detect: (h) => {
          const evidence: string[] = [];
          if (h['set-cookie'] && /connect\.sid/i.test(h['set-cookie'])) evidence.push('Express session cookie (connect.sid)');
          if (h['x-powered-by'] && /express/i.test(h['x-powered-by'])) evidence.push(`X-Powered-By: ${h['x-powered-by']}`);
          if (evidence.length > 0) return { name: 'Node.js', version: null, category: 'runtime', confidence: 'medium', evidence };
          return null;
        },
      },
      // -- Python (generic) --
      {
        name: 'Python', category: 'runtime',
        detect: (h) => {
          if (h['server'] && /python\/([\d.]+)/i.test(h['server'])) {
            const m = h['server'].match(/python\/([\d.]+)/i);
            return { name: 'Python', version: m?.[1] || null, category: 'runtime', confidence: 'high', evidence: [`Server: ${h['server']}`] };
          }
          return null;
        },
      },
    ];
  }

  // ================================================================
  // CVE DATABASE (common known vulnerabilities per version)
  // ================================================================
  private buildCveDb(): CveRecord[] {
    const versionParse = (v: string): number[] => v.split('.').map(Number);

    const wpBefore = (version: string, target: string): boolean => {
      const vp = versionParse(version);
      const tp = versionParse(target);
      for (let i = 0; i < Math.max(vp.length, tp.length); i++) {
        const a = vp[i] || 0;
        const b = tp[i] || 0;
        if (a !== b) return a < b;
      }
      return false;
    };

    const wpRange = (from: string, to: string) => (v: string) => !wpBefore(v, from) && wpBefore(v, to);

    return [
      // WordPress CVEs
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '4.5'), id: 'CVE-2016-10033', description: 'WordPress <= 4.5 - Remote Code Execution via PHPMailer', severity: 'critical' },
      { tech: 'WordPress', versionRange: wpRange('4.7', '4.7.5'), id: 'CVE-2018-6389', description: 'WordPress 4.7-4.7.5 - XSS via Media Library', severity: 'high' },
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '4.9.6'), id: 'CVE-2018-7588', description: 'WordPress < 4.9.6 - XXE vulnerability in media library', severity: 'high' },
      { tech: 'WordPress', versionRange: wpRange('5.0', '5.8.3'), id: 'CVE-2022-21661', description: 'WordPress 5.0-5.8.3 - SQL Injection via WP_Query', severity: 'critical' },
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '5.9.2'), id: 'CVE-2022-21664', description: 'WordPress < 5.9.2 - Stored XSS via comment editing', severity: 'high' },
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '6.0.3'), id: 'CVE-2022-3592', description: 'WordPress < 6.0.3 - Stored XSS via shortcodes', severity: 'medium' },
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '6.2.2'), id: 'CVE-2023-2862', description: 'WordPress < 6.2.2 - Stored XSS via SVG upload', severity: 'high' },
      { tech: 'WordPress', versionRange: (v) => wpBefore(v, '6.4.2'), id: 'CVE-2023-6883', description: 'WordPress < 6.4.2 - SQL Injection via `WP_Meta_Query`', severity: 'critical' },

      // Joomla CVEs
      { tech: 'Joomla', versionRange: (v) => wpBefore(v, '3.9.26'), id: 'CVE-2021-23132', description: 'Joomla < 3.9.26 - Remote Code Execution via object injection', severity: 'critical' },
      { tech: 'Joomla', versionRange: (v) => wpBefore(v, '3.10.5'), id: 'CVE-2022-27920', description: 'Joomla < 3.10.5 - XSS via com_contact', severity: 'high' },
      { tech: 'Joomla', versionRange: (v) => wpBefore(v, '4.2.9'), id: 'CVE-2023-30844', description: 'Joomla < 4.2.9 - Privilege Escalation', severity: 'critical' },

      // Drupal CVEs
      { tech: 'Drupal', versionRange: (v) => wpBefore(v, '7.80'), id: 'CVE-2021-26609', description: 'Drupal < 7.80 - Open Redirect', severity: 'medium' },
      { tech: 'Drupal', versionRange: (v) => wpBefore(v, '8.9.20'), id: 'CVE-2021-3126', description: 'Drupal < 8.9.20 - Remote Code Execution via PHPMailer', severity: 'critical' },
      { tech: 'Drupal', versionRange: (v) => wpBefore(v, '9.2.13'), id: 'CVE-2022-24728', description: 'Drupal < 9.2.13 - Access bypass', severity: 'high' },
      { tech: 'Drupal', versionRange: (v) => wpBefore(v, '9.4.7'), id: 'CVE-2022-39279', description: 'Drupal < 9.4.7 - Access bypass via redirect', severity: 'high' },

      // PHP CVEs
      { tech: 'PHP', versionRange: (v) => wpBefore(v, '7.4.30'), id: 'CVE-2022-31626', description: 'PHP < 7.4.30 - Multiple vulnerabilities', severity: 'critical' },
      { tech: 'PHP', versionRange: (v) => wpBefore(v, '8.0.22'), id: 'CVE-2022-37454', description: 'PHP < 8.0.22 - Buffer overflow in hash extension', severity: 'high' },
      { tech: 'PHP', versionRange: (v) => wpBefore(v, '8.1.9'), id: 'CVE-2022-31627', description: 'PHP < 8.1.9 - Disable function bypass', severity: 'high' },
      { tech: 'PHP', versionRange: (v) => wpBefore(v, '8.2.14'), id: 'CVE-2023-6553', description: 'PHP < 8.2.14 - XSS via EXIF parsing', severity: 'medium' },

      // Apache CVEs
      { tech: 'Apache', versionRange: (v) => wpBefore(v, '2.4.50'), id: 'CVE-2021-41773', description: 'Apache < 2.4.50 - Path Traversal and RCE', severity: 'critical' },
      { tech: 'Apache', versionRange: (v) => wpBefore(v, '2.4.52'), id: 'CVE-2021-44790', description: 'Apache < 2.4.52 - Buffer overflow in mod_lua', severity: 'high' },
      { tech: 'Apache', versionRange: (v) => wpBefore(v, '2.4.55'), id: 'CVE-2023-25690', description: 'Apache < 2.4.55 - HTTP Request Smuggling', severity: 'high' },
      { tech: 'Apache', versionRange: (v) => wpBefore(v, '2.4.57'), id: 'CVE-2023-27522', description: 'Apache < 2.4.57 - HTTP Response Splitting', severity: 'medium' },

      // Nginx CVEs
      { tech: 'Nginx', versionRange: (v) => wpBefore(v, '1.22.1'), id: 'CVE-2023-44487', description: 'Nginx < 1.22.1 - HTTP/2 Rapid Reset DDoS', severity: 'high' },
      { tech: 'Nginx', versionRange: (v) => wpBefore(v, '1.24.0'), id: 'CVE-2023-44487', description: 'Nginx < 1.24.0 - HTTP/2 Rapid Reset DDoS', severity: 'high' },
    ];
  }
}

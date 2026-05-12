import type { HeaderChecker, HeaderResult } from '../../common/interfaces/header-checker.interface';

export class SetCookieChecker implements HeaderChecker {
  readonly name = 'Set-Cookie';
  readonly severity = 'high' as const;
  readonly weight = 15;

  private readonly securePattern = /\bSecure\b/i;
  private readonly httpOnlyPattern = /\bHttpOnly\b/i;
  private readonly sameSitePattern = /\bSameSite=(Lax|Strict)\b/i;
  private readonly sameSiteNonePattern = /\bSameSite=None\b/i;

  analyze(value: string | undefined): HeaderResult {
    if (!value) {
      return {
        header: 'Set-Cookie',
        present: false,
        value: null,
        expected: 'Secure; HttpOnly; SameSite=Lax/Strict',
        grade: 1.0,
        severity: this.severity,
        weight: this.weight,
        finding: 'No cookies detected — no cookie security issues',
        recommendation:
          'When implementing cookies, always set Secure, HttpOnly, and SameSite attributes',
      };
    }

    const cookies = this.splitCookies(value);

    let worstGrade = 1.0;
    const cookieResults: string[] = [];

    for (const cookie of cookies) {
      const hasSecure = this.securePattern.test(cookie);
      const hasHttpOnly = this.httpOnlyPattern.test(cookie);
      const hasSameSiteLaxStrict = this.sameSitePattern.test(cookie);
      const hasSameSiteNone = this.sameSiteNonePattern.test(cookie);

      let cookieGrade = 0;

      if (hasSameSiteNone) {
        if (!hasSecure) {
          cookieGrade = 0;
          cookieResults.push('Cookie with SameSite=None must also have Secure flag');
          continue;
        }
      }

      const flagCount = [hasSecure, hasHttpOnly, hasSameSiteLaxStrict || hasSameSiteNone].filter(
        Boolean,
      ).length;
      cookieGrade = flagCount / 3;
      worstGrade = Math.min(worstGrade, cookieGrade);

      if (flagCount < 3) {
        const missing: string[] = [];
        if (!hasSecure) missing.push('Secure');
        if (!hasHttpOnly) missing.push('HttpOnly');
        if (!hasSameSiteLaxStrict && !hasSameSiteNone) missing.push('SameSite');
        cookieResults.push(`Cookie missing: ${missing.join(', ')}`);
      } else {
        cookieResults.push('Cookie has all security flags');
      }
    }

    const hasIssues = cookieResults.some((r) => r.includes('missing') || r.includes('Invalid'));

    return {
      header: 'Set-Cookie',
      present: true,
      value,
      expected: 'Secure; HttpOnly; SameSite=Lax/Strict',
      grade: worstGrade,
      severity: this.severity,
      weight: this.weight,
      finding: hasIssues
        ? `Cookie security issues found: ${cookieResults.filter((r) => r !== 'Cookie has all security flags').join('; ')}`
        : 'All cookies have proper security flags (Secure, HttpOnly, SameSite)',
      recommendation: hasIssues
        ? 'Ensure all cookies include: Secure (HTTPS only), HttpOnly (not accessible via JS), SameSite=Lax or Strict'
        : 'Cookie security attributes are properly configured',
    };
  }

  private splitCookies(headerValue: string): string[] {
    const cookies: string[] = [];
    let current = '';

    for (let i = 0; i < headerValue.length; i++) {
      const char = headerValue[i];

      if (char === ',') {
        const beforeComma = current.trim();
        if (/expires|max-age/i.test(beforeComma) && !beforeComma.includes('=')) {
          current += char;
          continue;
        }
        const remaining = headerValue.slice(i + 1).trim();
        if (/^[a-zA-Z_]/.test(remaining)) {
          cookies.push(current.trim());
          current = '';
          continue;
        }
        current += char;
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      cookies.push(current.trim());
    }

    return cookies;
  }
}

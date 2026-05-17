"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetCookieChecker = void 0;
const common_1 = require("@nestjs/common");
let SetCookieChecker = class SetCookieChecker {
    name = 'Set-Cookie';
    severity = 'high';
    weight = 15;
    securePattern = /\bSecure\b/i;
    httpOnlyPattern = /\bHttpOnly\b/i;
    sameSitePattern = /\bSameSite=(Lax|Strict)\b/i;
    sameSiteNonePattern = /\bSameSite=None\b/i;
    analyze(value) {
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
                recommendation: 'When implementing cookies, always set Secure, HttpOnly, and SameSite attributes',
            };
        }
        const cookies = this.splitCookies(value);
        let worstGrade = 1.0;
        const cookieResults = [];
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
            const flagCount = [hasSecure, hasHttpOnly, hasSameSiteLaxStrict || hasSameSiteNone].filter(Boolean).length;
            cookieGrade = flagCount / 3;
            worstGrade = Math.min(worstGrade, cookieGrade);
            if (flagCount < 3) {
                const missing = [];
                if (!hasSecure)
                    missing.push('Secure');
                if (!hasHttpOnly)
                    missing.push('HttpOnly');
                if (!hasSameSiteLaxStrict && !hasSameSiteNone)
                    missing.push('SameSite');
                cookieResults.push(`Cookie missing: ${missing.join(', ')}`);
            }
            else {
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
    splitCookies(headerValue) {
        const cookies = [];
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
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            cookies.push(current.trim());
        }
        return cookies;
    }
};
exports.SetCookieChecker = SetCookieChecker;
exports.SetCookieChecker = SetCookieChecker = __decorate([
    (0, common_1.Injectable)()
], SetCookieChecker);
//# sourceMappingURL=set-cookie.checker.js.map
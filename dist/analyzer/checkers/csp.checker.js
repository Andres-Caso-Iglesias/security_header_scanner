"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CspChecker = void 0;
const common_1 = require("@nestjs/common");
let CspChecker = class CspChecker {
    name = 'CSP';
    severity = 'critical';
    weight = 25;
    analyze(value) {
        if (!value) {
            return {
                header: 'Content-Security-Policy',
                present: false,
                value: null,
                expected: 'Present with restrictive policy (default-src, script-src, object-src)',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Content-Security-Policy header is missing — site is vulnerable to XSS and data injection attacks',
                recommendation: "Implement a strict CSP policy. Start with: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'",
            };
        }
        const hasDefaultSrc = /\bdefault-src\s/.test(value);
        const hasScriptSrc = /\bscript-src\s/.test(value);
        const hasObjectSrc = /\bobject-src\s/.test(value);
        const hasUnsafeInline = /'unsafe-inline'/.test(value);
        const hasUnsafeEval = /'unsafe-eval'/.test(value);
        let grade = 0.3;
        const issues = [];
        if (hasDefaultSrc) {
            grade = 0.5;
        }
        if (hasScriptSrc) {
            grade = 0.7;
        }
        if (hasDefaultSrc && (hasScriptSrc || hasObjectSrc)) {
            grade = 0.8;
        }
        if (hasUnsafeInline) {
            issues.push('contains unsafe-inline');
            grade = Math.min(grade, 0.4);
        }
        if (hasUnsafeEval) {
            issues.push('contains unsafe-eval');
            grade = Math.min(grade, 0.4);
        }
        if (!hasUnsafeInline && !hasUnsafeEval && hasDefaultSrc && hasScriptSrc && hasObjectSrc) {
            grade = 1.0;
        }
        const finding = issues.length > 0
            ? `Content-Security-Policy is present but ${issues.join(' and ')}`
            : 'Content-Security-Policy is present';
        const recommendation = issues.length > 0
            ? `Remove unsafe directives: ${issues.join(', ')}. Consider using nonces or hashes for inline scripts.`
            : 'Review CSP policy to ensure it is restrictive enough. Consider adding reporting via report-uri or report-to.';
        return {
            header: 'Content-Security-Policy',
            present: true,
            value,
            expected: 'Restrictive policy without unsafe-inline or unsafe-eval',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation,
        };
    }
};
exports.CspChecker = CspChecker;
exports.CspChecker = CspChecker = __decorate([
    (0, common_1.Injectable)()
], CspChecker);
//# sourceMappingURL=csp.checker.js.map
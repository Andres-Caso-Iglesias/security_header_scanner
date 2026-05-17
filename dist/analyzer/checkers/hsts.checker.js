"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HstsChecker = void 0;
const common_1 = require("@nestjs/common");
let HstsChecker = class HstsChecker {
    name = 'HSTS';
    severity = 'high';
    weight = 15;
    analyze(value) {
        if (!value) {
            return {
                header: 'Strict-Transport-Security',
                present: false,
                value: null,
                expected: 'max-age=31536000; includeSubDomains',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Strict-Transport-Security header is missing — site is vulnerable to SSL stripping and MITM attacks',
                recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
            };
        }
        const maxAgeMatch = value.match(/max-age=(\d+)/);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
        const hasIncludeSubDomains = /\bincludeSubDomains\b/i.test(value);
        const hasPreload = /\bpreload\b/i.test(value);
        let grade = 0.3;
        const issues = [];
        if (maxAge >= 31536000) {
            grade = 0.6;
        }
        else if (maxAge > 0) {
            grade = 0.4;
            issues.push(`max-age (${maxAge}) is less than recommended 31536000`);
        }
        if (hasIncludeSubDomains) {
            grade = Math.min(grade + 0.3, 1.0);
        }
        else {
            issues.push('missing includeSubDomains directive');
        }
        if (hasPreload) {
            grade = Math.min(grade + 0.1, 1.0);
        }
        return {
            header: 'Strict-Transport-Security',
            present: true,
            value,
            expected: 'max-age=31536000; includeSubDomains; preload',
            grade: Math.round(grade * 10) / 10,
            severity: this.severity,
            weight: this.weight,
            finding: issues.length > 0
                ? `HSTS is present but ${issues.join(', ')}`
                : 'HSTS is properly configured',
            recommendation: issues.length > 0
                ? `Fix: ${issues.join('. ')}. Recommended: max-age=31536000; includeSubDomains; preload`
                : 'HSTS configuration looks good. Consider submitting to the HSTS preload list.',
        };
    }
};
exports.HstsChecker = HstsChecker;
exports.HstsChecker = HstsChecker = __decorate([
    (0, common_1.Injectable)()
], HstsChecker);
//# sourceMappingURL=hsts.checker.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsChecker = void 0;
const common_1 = require("@nestjs/common");
let CorsChecker = class CorsChecker {
    name = 'CORS';
    severity = 'high';
    weight = 15;
    analyze(value) {
        if (!value) {
            return {
                header: 'Access-Control-Allow-Origin',
                present: false,
                value: null,
                expected: 'Specific origin, not wildcard',
                grade: 1.0,
                severity: this.severity,
                weight: this.weight,
                finding: 'CORS header not present — no cross-origin requests allowed (secure by default)',
                recommendation: 'If cross-origin access is needed, set specific origins, not wildcards. If not needed, no action required.',
            };
        }
        const trimmed = value.trim();
        const isWildcard = trimmed === '*';
        const hasNullOrigin = trimmed === 'null';
        const isSpecificOrigin = trimmed.startsWith('http') && !isWildcard;
        let grade;
        let finding;
        let recommendation;
        if (isWildcard) {
            grade = 0;
            finding = 'CORS is configured with wildcard (*) — any origin can access resources';
            recommendation =
                'CRITICAL: Replace wildcard (*) with specific allowed origins. Example: Access-Control-Allow-Origin: https://yourdomain.com';
        }
        else if (hasNullOrigin) {
            grade = 0.1;
            finding = 'CORS allows null origin — this is dangerous and should be avoided';
            recommendation = 'Remove "null" from allowed origins. Use specific origins instead.';
        }
        else if (isSpecificOrigin) {
            grade = 1.0;
            finding = `CORS is properly restricted to: ${value}`;
            recommendation = 'CORS is properly configured with specific origins';
        }
        else {
            grade = 0.5;
            finding = `CORS has non-standard value: ${value}`;
            recommendation = 'Ensure CORS configuration uses valid origins';
        }
        return {
            header: 'Access-Control-Allow-Origin',
            present: true,
            value,
            expected: 'Specific origin, not wildcard',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation,
        };
    }
};
exports.CorsChecker = CorsChecker;
exports.CorsChecker = CorsChecker = __decorate([
    (0, common_1.Injectable)()
], CorsChecker);
//# sourceMappingURL=cors.checker.js.map
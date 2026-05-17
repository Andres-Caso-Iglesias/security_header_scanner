"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheControlChecker = void 0;
const common_1 = require("@nestjs/common");
let CacheControlChecker = class CacheControlChecker {
    name = 'Cache-Control';
    severity = 'medium';
    weight = 10;
    analyze(value) {
        if (!value) {
            return {
                header: 'Cache-Control',
                present: false,
                value: null,
                expected: 'no-store for sensitive endpoints',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Cache-Control header is missing — sensitive data may be cached by browsers and proxies',
                recommendation: 'Add Cache-Control headers. For sensitive data: Cache-Control: no-store. For static assets: Cache-Control: public, max-age=31536000, immutable',
            };
        }
        const lower = value.toLowerCase();
        const hasNoStore = /\bno-store\b/.test(lower);
        const hasNoCache = /\bno-cache\b/.test(lower);
        const hasPrivate = /\bprivate\b/.test(lower);
        const hasPublic = /\bpublic\b/.test(lower);
        let grade = 0.3;
        let finding;
        if (hasNoStore) {
            grade = 1.0;
            finding = 'Cache-Control is set to no-store — sensitive data will not be cached';
        }
        else if (hasNoCache && hasPrivate) {
            grade = 0.7;
            finding =
                'Cache-Control uses no-cache + private — reasonable protection but no-store is preferred for sensitive data';
        }
        else if (hasNoCache) {
            grade = 0.5;
            finding = 'Cache-Control uses no-cache — browser will revalidate but may still cache';
        }
        else if (hasPrivate) {
            grade = 0.4;
            finding = 'Cache-Control allows private caching (browser only, not proxies)';
        }
        else if (hasPublic) {
            grade = 0.2;
            finding = 'Cache-Control allows public caching — sensitive data should not be cached';
        }
        else {
            finding = `Cache-Control has value: ${value} — review if this is appropriate`;
        }
        return {
            header: 'Cache-Control',
            present: true,
            value,
            expected: 'no-store for sensitive endpoints',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation: grade < 1.0
                ? 'Consider using Cache-Control: no-store for sensitive endpoints, and appropriate caching headers for public assets'
                : 'Cache-Control is properly configured for sensitive data',
        };
    }
};
exports.CacheControlChecker = CacheControlChecker;
exports.CacheControlChecker = CacheControlChecker = __decorate([
    (0, common_1.Injectable)()
], CacheControlChecker);
//# sourceMappingURL=cache-control.checker.js.map
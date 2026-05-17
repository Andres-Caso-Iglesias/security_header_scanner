"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsPolicyChecker = void 0;
const common_1 = require("@nestjs/common");
let PermissionsPolicyChecker = class PermissionsPolicyChecker {
    name = 'Permissions-Policy';
    severity = 'medium';
    weight = 10;
    analyze(value) {
        if (!value) {
            return {
                header: 'Permissions-Policy',
                present: false,
                value: null,
                expected: 'Restrictive policy without wildcards',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Permissions-Policy header is missing — all browser APIs are available by default',
                recommendation: 'Add a Permissions-Policy header to restrict access to sensitive APIs (camera, microphone, geolocation, etc.)',
            };
        }
        const hasWildcard = /\b\*\)/.test(value);
        const hasGeolocation = /\bgeolocation/i.test(value);
        const hasCamera = /\bcamera\b/i.test(value);
        const hasMicrophone = /\bmicrophone\b/i.test(value);
        let grade = 0.5;
        const issues = [];
        if (hasWildcard) {
            grade = 0.2;
            issues.push('contains wildcard (*) permissions');
        }
        if (hasGeolocation || hasCamera || hasMicrophone) {
            grade = Math.min(grade + 0.3, 1.0);
        }
        else {
            issues.push('consider explicitly restricting sensitive APIs');
        }
        if (!hasWildcard && !issues.length) {
            grade = 0.8;
        }
        return {
            header: 'Permissions-Policy',
            present: true,
            value,
            expected: 'Restrictive policy without wildcards',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding: issues.length > 0
                ? `Permissions-Policy is present but ${issues.join(', ')}`
                : 'Permissions-Policy is present',
            recommendation: issues.includes('contains wildcard (*) permissions')
                ? 'Remove wildcard (*) permissions. Explicitly list allowed origins for each feature.'
                : 'Review and tighten Permissions-Policy to only allow necessary features',
        };
    }
};
exports.PermissionsPolicyChecker = PermissionsPolicyChecker;
exports.PermissionsPolicyChecker = PermissionsPolicyChecker = __decorate([
    (0, common_1.Injectable)()
], PermissionsPolicyChecker);
//# sourceMappingURL=permissions-policy.checker.js.map
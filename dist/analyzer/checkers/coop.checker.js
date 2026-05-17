"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoopChecker = void 0;
const common_1 = require("@nestjs/common");
let CoopChecker = class CoopChecker {
    name = 'COOP';
    severity = 'medium';
    weight = 10;
    analyze(value) {
        if (!value) {
            return {
                header: 'Cross-Origin-Opener-Policy',
                present: false,
                value: null,
                expected: 'same-origin',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Cross-Origin-Opener-Policy is missing — window may be accessible cross-origin (Spectre-like attacks)',
                recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin (or same-origin-allow-popups if popups need access)',
            };
        }
        const lower = value.toLowerCase().trim();
        let grade;
        let finding;
        if (lower === 'same-origin') {
            grade = 1.0;
            finding = 'COOP is set to same-origin — best isolation against cross-origin attacks';
        }
        else if (lower === 'same-origin-allow-popups') {
            grade = 0.6;
            finding = 'COOP is set to same-origin-allow-popups — allows popups to access window';
        }
        else if (lower === 'unsafe-none') {
            grade = 0;
            finding = 'COOP is set to unsafe-none — no cross-origin isolation';
        }
        else {
            grade = 0.3;
            finding = `COOP has unrecognized value: ${value}`;
        }
        return {
            header: 'Cross-Origin-Opener-Policy',
            present: true,
            value,
            expected: 'same-origin',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation: grade < 1.0
                ? 'Set Cross-Origin-Opener-Policy: same-origin for strong cross-origin isolation'
                : 'COOP is properly configured',
        };
    }
};
exports.CoopChecker = CoopChecker;
exports.CoopChecker = CoopChecker = __decorate([
    (0, common_1.Injectable)()
], CoopChecker);
//# sourceMappingURL=coop.checker.js.map
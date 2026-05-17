"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XFrameOptionsChecker = void 0;
const common_1 = require("@nestjs/common");
let XFrameOptionsChecker = class XFrameOptionsChecker {
    name = 'X-Frame-Options';
    severity = 'high';
    weight = 15;
    analyze(value) {
        if (!value) {
            return {
                header: 'X-Frame-Options',
                present: false,
                value: null,
                expected: 'DENY or SAMEORIGIN',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'X-Frame-Options header is missing — site is vulnerable to clickjacking attacks',
                recommendation: 'Add: X-Frame-Options: DENY (preferred) or X-Frame-Options: SAMEORIGIN (if frames from same origin are needed)',
            };
        }
        const upper = value.toUpperCase().trim();
        let grade = 0.3;
        let finding;
        if (upper === 'DENY') {
            grade = 1.0;
            finding = 'X-Frame-Options is set to DENY — best protection against clickjacking';
        }
        else if (upper === 'SAMEORIGIN') {
            grade = 0.8;
            finding = 'X-Frame-Options is set to SAMEORIGIN — allows framing from same origin';
        }
        else if (upper === 'ALLOW-FROM') {
            grade = 0.5;
            finding =
                'X-Frame-Options uses ALLOW-FROM (deprecated, consider CSP frame-ancestors instead)';
        }
        else {
            finding = `X-Frame-Options has unrecognized value: ${value}`;
        }
        return {
            header: 'X-Frame-Options',
            present: true,
            value,
            expected: 'DENY or SAMEORIGIN',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation: grade < 1.0
                ? 'Set X-Frame-Options: DENY for complete clickjacking protection'
                : 'X-Frame-Options is properly configured',
        };
    }
};
exports.XFrameOptionsChecker = XFrameOptionsChecker;
exports.XFrameOptionsChecker = XFrameOptionsChecker = __decorate([
    (0, common_1.Injectable)()
], XFrameOptionsChecker);
//# sourceMappingURL=x-frame-options.checker.js.map
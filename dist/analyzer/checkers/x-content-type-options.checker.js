"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XContentTypeOptionsChecker = void 0;
const common_1 = require("@nestjs/common");
let XContentTypeOptionsChecker = class XContentTypeOptionsChecker {
    name = 'X-Content-Type-Options';
    severity = 'medium';
    weight = 10;
    analyze(value) {
        if (!value) {
            return {
                header: 'X-Content-Type-Options',
                present: false,
                value: null,
                expected: 'nosniff',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'X-Content-Type-Options header is missing — browser may perform MIME-type sniffing',
                recommendation: 'Add: X-Content-Type-Options: nosniff',
            };
        }
        const normalized = value.toLowerCase().trim();
        const isNosniff = normalized === 'nosniff';
        return {
            header: 'X-Content-Type-Options',
            present: true,
            value,
            expected: 'nosniff',
            grade: isNosniff ? 1.0 : 0.3,
            severity: this.severity,
            weight: this.weight,
            finding: isNosniff
                ? 'X-Content-Type-Options is set to nosniff — prevents MIME sniffing'
                : `X-Content-Type-Options has unexpected value: ${value}`,
            recommendation: isNosniff
                ? 'X-Content-Type-Options is properly configured'
                : 'Set X-Content-Type-Options: nosniff exactly',
        };
    }
};
exports.XContentTypeOptionsChecker = XContentTypeOptionsChecker;
exports.XContentTypeOptionsChecker = XContentTypeOptionsChecker = __decorate([
    (0, common_1.Injectable)()
], XContentTypeOptionsChecker);
//# sourceMappingURL=x-content-type-options.checker.js.map
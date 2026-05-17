"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XPoweredByChecker = void 0;
const common_1 = require("@nestjs/common");
let XPoweredByChecker = class XPoweredByChecker {
    name = 'X-Powered-By';
    severity = 'low';
    weight = 5;
    analyze(value) {
        if (!value) {
            return {
                header: 'X-Powered-By',
                present: false,
                value: null,
                expected: 'Not present',
                grade: 1.0,
                severity: this.severity,
                weight: this.weight,
                finding: 'X-Powered-By header is not present — no technology information leakage',
                recommendation: 'No action needed. This header should remain absent.',
            };
        }
        return {
            header: 'X-Powered-By',
            present: true,
            value,
            expected: 'Not present',
            grade: 0,
            severity: this.severity,
            weight: this.weight,
            finding: `X-Powered-By header exposes technology information: "${value}" — aids attackers in fingerprinting`,
            recommendation: 'Remove the X-Powered-By header in your server/application configuration to prevent technology fingerprinting',
        };
    }
};
exports.XPoweredByChecker = XPoweredByChecker;
exports.XPoweredByChecker = XPoweredByChecker = __decorate([
    (0, common_1.Injectable)()
], XPoweredByChecker);
//# sourceMappingURL=x-powered-by.checker.js.map
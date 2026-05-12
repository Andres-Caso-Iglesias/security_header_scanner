"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XPoweredByChecker = void 0;
class XPoweredByChecker {
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
}
exports.XPoweredByChecker = XPoweredByChecker;
//# sourceMappingURL=x-powered-by.checker.js.map
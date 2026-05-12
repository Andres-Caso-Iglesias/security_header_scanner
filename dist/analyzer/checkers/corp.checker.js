"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorpChecker = void 0;
class CorpChecker {
    name = 'CORP';
    severity = 'medium';
    weight = 10;
    analyze(value) {
        if (!value) {
            return {
                header: 'Cross-Origin-Resource-Policy',
                present: false,
                value: null,
                expected: 'same-origin or same-site',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Cross-Origin-Resource-Policy is missing — resources can be loaded by cross-origin sites',
                recommendation: 'Add: Cross-Origin-Resource-Policy: same-origin (or same-site if cross-origin subresources are needed)',
            };
        }
        const lower = value.toLowerCase().trim();
        let grade;
        let finding;
        if (lower === 'same-origin') {
            grade = 1.0;
            finding =
                'CORP is set to same-origin — best protection against cross-origin resource loading';
        }
        else if (lower === 'same-site') {
            grade = 0.8;
            finding = 'CORP is set to same-site — allows same-site cross-origin resources';
        }
        else if (lower === 'cross-origin') {
            grade = 0.1;
            finding = 'CORP is set to cross-origin — any site can load resources';
        }
        else {
            grade = 0.3;
            finding = `CORP has unrecognized value: ${value}`;
        }
        return {
            header: 'Cross-Origin-Resource-Policy',
            present: true,
            value,
            expected: 'same-origin or same-site',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation: grade < 0.8
                ? 'Set Cross-Origin-Resource-Policy: same-origin to prevent cross-origin resource loading'
                : 'CORP is properly configured',
        };
    }
}
exports.CorpChecker = CorpChecker;
//# sourceMappingURL=corp.checker.js.map
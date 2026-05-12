"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferrerPolicyChecker = void 0;
class ReferrerPolicyChecker {
    name = 'Referrer-Policy';
    severity = 'medium';
    weight = 10;
    strictPolicies = [
        'no-referrer',
        'strict-origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'no-referrer-when-downgrade',
    ];
    analyze(value) {
        if (!value) {
            return {
                header: 'Referrer-Policy',
                present: false,
                value: null,
                expected: 'strict-origin-when-cross-origin',
                grade: 0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Referrer-Policy header is missing — referrer information may leak across origins',
                recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
            };
        }
        const normalized = value.toLowerCase().trim();
        const isStrict = this.strictPolicies.includes(normalized);
        const isInsecure = normalized === 'unsafe-url' || normalized === 'origin-when-cross-origin';
        let grade;
        let finding;
        let recommendation;
        if (isStrict) {
            grade = 1.0;
            finding = `Referrer-Policy is set to "${value}" — good privacy protection`;
            recommendation = 'Referrer-Policy is properly configured';
        }
        else if (isInsecure) {
            grade = 0.3;
            finding = `Referrer-Policy "${value}" may leak referrer information`;
            recommendation = 'Change to: Referrer-Policy: strict-origin-when-cross-origin';
        }
        else {
            grade = 0.5;
            finding = `Referrer-Policy is set to "${value}"`;
            recommendation =
                'Review if this policy meets your privacy requirements. Consider: strict-origin-when-cross-origin';
        }
        return {
            header: 'Referrer-Policy',
            present: true,
            value,
            expected: 'strict-origin-when-cross-origin',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation,
        };
    }
}
exports.ReferrerPolicyChecker = ReferrerPolicyChecker;
//# sourceMappingURL=referrer-policy.checker.js.map
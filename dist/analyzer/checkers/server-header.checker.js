"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerHeaderChecker = void 0;
class ServerHeaderChecker {
    name = 'Server-Header';
    severity = 'low';
    weight = 5;
    analyze(value) {
        if (!value) {
            return {
                header: 'Server',
                present: false,
                value: null,
                expected: 'Minimal server info or not present',
                grade: 1.0,
                severity: this.severity,
                weight: this.weight,
                finding: 'Server header is not present — no server technology leakage',
                recommendation: 'No action needed. This header should remain absent or minimal.',
            };
        }
        const isVerbose = value.length > 20 || /\//.test(value) || /\d+\.\d+/.test(value);
        const isMinimal = ['cloudflare', 'nginx', 'apache', 'server'].some((s) => value.toLowerCase() === s);
        let grade;
        let finding;
        let recommendation;
        if (isVerbose) {
            grade = 0;
            finding = `Server header leaks detailed information: "${value}" — aids attacker fingerprinting`;
            recommendation =
                'Configure your server to return minimal Server header (e.g., "Server: Apache" instead of "Apache/2.4.41 (Ubuntu)")';
        }
        else if (isMinimal) {
            grade = 0.5;
            finding = `Server header reveals server type: "${value}"`;
            recommendation =
                'Consider removing or customizing the Server header to disclose minimal information';
        }
        else {
            grade = 0.3;
            finding = `Server header is present: "${value}"`;
            recommendation =
                'Consider removing the Server header entirely or setting it to a generic value';
        }
        return {
            header: 'Server',
            present: true,
            value,
            expected: 'Minimal server info or not present',
            grade,
            severity: this.severity,
            weight: this.weight,
            finding,
            recommendation,
        };
    }
}
exports.ServerHeaderChecker = ServerHeaderChecker;
//# sourceMappingURL=server-header.checker.js.map
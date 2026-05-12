"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nis2Mapper = void 0;
class Nis2Mapper {
    version = '2023';
    map(headers) {
        return [
            this.mapArticle21cAccessControl(headers),
            this.mapArticle21dIncidentHandling(headers),
            this.mapArticle21gSupplyChain(headers),
            this.mapArticle21iCryptography(headers),
        ].flat();
    }
    mapArticle21cAccessControl(headers) {
        const cors = headers.find((h) => h.header === 'Access-Control-Allow-Origin');
        const cookies = headers.find((h) => h.header === 'Set-Cookie');
        const coop = headers.find((h) => h.header === 'Cross-Origin-Opener-Policy');
        const relatedHeaders = [];
        const issues = [];
        if (cors && cors.grade < 1.0) {
            relatedHeaders.push(cors.header);
            issues.push('CORS allows unrestricted cross-origin access');
        }
        if (cookies && cookies.grade < 1.0) {
            relatedHeaders.push(cookies.header);
            issues.push('Cookie security attributes are insufficient');
        }
        if (coop && coop.grade < 0.6) {
            relatedHeaders.push(coop.header);
            issues.push('Cross-origin isolation is weak');
        }
        const status = issues.length === 0 ? 'compliant' : 'non_compliant';
        return {
            control: 'NIS2 Art.21(c) - Access Control',
            status,
            relatedHeaders,
            description: issues.length > 0
                ? `Access control issues: ${issues.join('; ')}`
                : 'Access control mechanisms are properly configured',
            recommendation: issues.length > 0
                ? 'Implement strict CORS policies, secure cookie attributes, and cross-origin isolation'
                : 'Maintain current access control configuration',
        };
    }
    mapArticle21dIncidentHandling(headers) {
        const csp = headers.find((h) => h.header === 'Content-Security-Policy');
        const hasReporting = csp?.value &&
            (/\breport-(to|uri)\b/i.test(csp.value) || /\breporting-endpoints?\b/i.test(csp.value));
        return {
            control: 'NIS2 Art.21(d) - Incident Handling',
            status: hasReporting ? 'compliant' : 'partially_compliant',
            relatedHeaders: csp ? ['Content-Security-Policy'] : [],
            description: hasReporting
                ? 'CSP includes reporting endpoints for incident detection'
                : 'No security incident reporting mechanism detected via headers. Consider enabling CSP reporting.',
            recommendation: hasReporting
                ? 'Maintain incident reporting configuration'
                : 'Add CSP report-to or report-uri directives to enable security incident detection',
        };
    }
    mapArticle21gSupplyChain(headers) {
        const corp = headers.find((h) => h.header === 'Cross-Origin-Resource-Policy');
        const coep = headers.find((h) => h.header === 'Cross-Origin-Embedder-Policy');
        const relatedHeaders = [];
        const issues = [];
        if (corp && corp.grade < 0.6) {
            relatedHeaders.push(corp.header);
            issues.push('Cross-origin resource policy is too permissive');
        }
        if (coep && coep.grade < 0.6) {
            relatedHeaders.push(coep.header);
            issues.push('Cross-origin embedding policy is too permissive');
        }
        const status = issues.length === 0 ? 'compliant' : 'partially_compliant';
        return {
            control: 'NIS2 Art.21(g) - Supply Chain Security',
            status,
            relatedHeaders,
            description: issues.length > 0
                ? `Supply chain security gaps: ${issues.join('; ')}`
                : 'Supply chain security measures are properly configured',
            recommendation: issues.length > 0
                ? 'Restrict cross-origin resource and embedding policies to prevent supply chain attacks'
                : 'Continue monitoring supply chain security configuration',
        };
    }
    mapArticle21iCryptography(headers) {
        const hsts = headers.find((h) => h.header === 'Strict-Transport-Security');
        const usesHttps = hsts && hsts.grade > 0;
        const hasStrongCrypto = hsts && hsts.grade >= 0.6;
        let status;
        let description;
        let recommendation;
        if (usesHttps && hasStrongCrypto) {
            status = 'compliant';
            description = 'HTTPS enforcement and encryption are properly configured via HSTS';
            recommendation = 'Maintain current cryptographic configuration';
        }
        else if (usesHttps) {
            status = 'partially_compliant';
            description = 'HTTPS is enforced but HSTS configuration could be stronger';
            recommendation =
                'Strengthen HSTS: set max-age to at least 31536000 and include includeSubDomains';
        }
        else {
            status = 'non_compliant';
            description = 'No HTTPS enforcement detected via HSTS header';
            recommendation = 'Enable HSTS to enforce encrypted communications';
        }
        return {
            control: 'NIS2 Art.21(i) - Cryptography and Encryption',
            status,
            relatedHeaders: hsts ? ['Strict-Transport-Security'] : [],
            description,
            recommendation,
        };
    }
}
exports.Nis2Mapper = Nis2Mapper;
//# sourceMappingURL=nis2.mapper.js.map
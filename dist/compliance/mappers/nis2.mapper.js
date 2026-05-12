"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nis2Mapper = void 0;
class Nis2Mapper {
    version = '2023';
    map(headers, tls, dns) {
        return [
            this.mapArticle21cAccessControl(headers),
            this.mapArticle21dIncidentHandling(headers),
            this.mapArticle21gSupplyChain(headers, dns),
            this.mapArticle21iCryptography(headers, tls),
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
    mapArticle21gSupplyChain(headers, dns) {
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
        if (dns && dns.checked && !dns.error) {
            if (!dns.spf.present) {
                issues.push('Missing SPF record - email impersonation risk');
            }
            if (!dns.dkim.present) {
                issues.push('Missing DKIM record - email integrity risk');
            }
            if (!dns.dmarc.present) {
                issues.push('Missing DMARC record - email spoofing risk');
            }
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
                ? 'Restrict cross-origin resource and embedding policies and configure DNS email security (SPF/DKIM/DMARC)'
                : 'Continue monitoring supply chain security configuration',
        };
    }
    mapArticle21iCryptography(headers, tls) {
        const hsts = headers.find((h) => h.header === 'Strict-Transport-Security');
        const hasHsts = hsts && hsts.grade > 0;
        const strongHsts = hsts && hsts.grade >= 0.6;
        const tlsVersion = tls?.tlsVersion;
        const tlsError = tls?.error;
        const certExpired = tls?.certificate?.expired;
        const certSelfSigned = tls?.certificate?.selfSigned;
        const tlsGrade = tls?.grade ?? 0;
        const relatedHeaders = [];
        if (hsts)
            relatedHeaders.push('Strict-Transport-Security');
        const issues = [];
        if (tlsError) {
            issues.push(`TLS handshake failed: ${tlsError}`);
        }
        else {
            if (tlsVersion && tlsVersion < 'TLSv1.2') {
                issues.push(`Outdated TLS version: ${tlsVersion}`);
            }
            if (certExpired) {
                issues.push('SSL certificate is expired');
            }
            if (certSelfSigned) {
                issues.push('SSL certificate is self-signed');
            }
        }
        if (!hasHsts) {
            issues.push('HSTS is not configured');
        }
        let status;
        let description;
        let recommendation;
        if (issues.length === 0 && strongHsts && tlsGrade >= 0.8) {
            status = 'compliant';
            description = `TLS ${tlsVersion} with valid certificate and HSTS properly configured`;
            recommendation = 'Maintain current cryptographic configuration';
        }
        else if (issues.length === 0 && tlsGrade >= 0.5) {
            status = 'partially_compliant';
            description = 'Encryption is in place but some improvements are recommended';
            recommendation = 'Strengthen HSTS configuration and ensure TLS 1.2 or higher';
        }
        else if (tlsError && tlsError === 'TLS check only applies to HTTPS URLs') {
            status = 'non_compliant';
            description = 'Site is served over HTTP without TLS encryption';
            recommendation = 'Migrate to HTTPS and enforce HSTS';
        }
        else {
            status = 'non_compliant';
            description = `Cryptography issues: ${issues.join('; ')}`;
            recommendation = 'Address TLS/certificate issues and implement HSTS with strong configuration';
        }
        return {
            control: 'NIS2 Art.21(i) - Cryptography and Encryption',
            status,
            relatedHeaders,
            description,
            recommendation,
        };
    }
}
exports.Nis2Mapper = Nis2Mapper;
//# sourceMappingURL=nis2.mapper.js.map
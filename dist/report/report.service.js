"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
let ReportService = class ReportService {
    generate(input) {
        const recommendations = this.generateRecommendations(input.headers.headers, input.tls, input.dns);
        return {
            url: input.url,
            timestamp: new Date().toISOString(),
            score: input.headers.score,
            grade: input.headers.grade,
            headers: input.headers.headers,
            compliance: input.compliance,
            recommendations,
            metadata: input.metadata,
            tls: input.tls,
            dns: input.dns,
        };
    }
    generateRecommendations(headers, tls, dns) {
        const criticalIssues = headers
            .filter((h) => h.severity === 'critical' && h.grade < 1.0)
            .map((h) => `[CRITICAL] ${h.recommendation}`);
        const highIssues = headers
            .filter((h) => h.severity === 'high' && h.grade < 1.0)
            .map((h) => `[HIGH] ${h.recommendation}`);
        const mediumIssues = headers
            .filter((h) => h.severity === 'medium' && h.grade < 1.0)
            .map((h) => `[MEDIUM] ${h.recommendation}`);
        const lowIssues = headers
            .filter((h) => h.severity === 'low' && h.grade < 1.0)
            .map((h) => `[LOW] ${h.recommendation}`);
        const tlsRecs = [];
        if (tls.checked && tls.error) {
            if (tls.error !== 'TLS check only applies to HTTPS URLs') {
                tlsRecs.push(`[HIGH] TLS error: ${tls.error}`);
            }
        }
        else if (tls.checked && tls.certificate) {
            if (tls.certificate.expired) {
                tlsRecs.push(`[CRITICAL] SSL certificate expired on ${tls.certificate.validTo}. Renew immediately.`);
            }
            if (tls.certificate.selfSigned) {
                tlsRecs.push(`[HIGH] SSL certificate is self-signed. Replace with a CA-signed certificate.`);
            }
            if (tls.certificate.expiresInDays >= 0 && tls.certificate.expiresInDays < 30) {
                tlsRecs.push(`[HIGH] SSL certificate expires in ${tls.certificate.expiresInDays} days. Renew soon.`);
            }
            if (tls.tlsVersion && tls.tlsVersion < 'TLSv1.2') {
                tlsRecs.push(`[CRITICAL] Outdated TLS version: ${tls.tlsVersion}. Upgrade to TLS 1.2 or 1.3.`);
            }
        }
        const dnsRecs = [];
        if (dns.checked && dns.error) {
            dnsRecs.push(`[MEDIUM] DNS check error: ${dns.error}`);
        }
        else {
            if (dns.spf.grade < 1.0) {
                dnsRecs.push(`[MEDIUM] ${dns.spf.recommendation}`);
            }
            if (dns.dkim.grade < 1.0) {
                dnsRecs.push(`[MEDIUM] ${dns.dkim.recommendation}`);
            }
            if (dns.dmarc.grade < 1.0) {
                dnsRecs.push(`[MEDIUM] ${dns.dmarc.recommendation}`);
            }
        }
        return [...tlsRecs, ...dnsRecs, ...criticalIssues, ...highIssues, ...mediumIssues, ...lowIssues];
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)()
], ReportService);
//# sourceMappingURL=report.service.js.map
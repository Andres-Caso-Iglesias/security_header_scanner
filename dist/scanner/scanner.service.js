"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerService = void 0;
const common_1 = require("@nestjs/common");
const http_client_service_1 = require("./http-client/http-client.service");
const tls_checker_service_1 = require("./tls/tls-checker.service");
const dns_checker_service_1 = require("./dns/dns-checker.service");
const security_file_checker_service_1 = require("./files/security-file-checker.service");
const sensitive_file_checker_service_1 = require("./files/sensitive-file-checker.service");
const sri_checker_service_1 = require("./content/sri-checker.service");
const tech_fingerprinter_service_1 = require("./fingerprint/tech-fingerprinter.service");
const analyzer_service_1 = require("../analyzer/analyzer.service");
const compliance_service_1 = require("../compliance/compliance.service");
const report_service_1 = require("../report/report.service");
let ScannerService = class ScannerService {
    httpClient;
    tlsChecker;
    dnsChecker;
    securityFileChecker;
    sensitiveFileChecker;
    sriChecker;
    techFingerprinter;
    analyzer;
    compliance;
    report;
    constructor(httpClient, tlsChecker, dnsChecker, securityFileChecker, sensitiveFileChecker, sriChecker, techFingerprinter, analyzer, compliance, report) {
        this.httpClient = httpClient;
        this.tlsChecker = tlsChecker;
        this.dnsChecker = dnsChecker;
        this.securityFileChecker = securityFileChecker;
        this.sensitiveFileChecker = sensitiveFileChecker;
        this.sriChecker = sriChecker;
        this.techFingerprinter = techFingerprinter;
        this.analyzer = analyzer;
        this.compliance = compliance;
        this.report = report;
    }
    async scan(url) {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
        const protocol = parsedUrl.protocol;
        const baseOrigin = `${protocol}//${hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;
        const [httpResult, tlsResult, dnsResult, securityFilesResult, sriResult, sensitiveFilesResult] = await Promise.all([
            this.httpClient.fetch(url),
            protocol === 'https:' ? this.tlsChecker.check(hostname, port) : Promise.resolve({
                checked: false, hostname, port,
                error: 'TLS check only applies to HTTPS URLs',
                tlsVersion: null, certificate: null, grade: 0,
            }),
            this.dnsChecker.check(hostname),
            this.securityFileChecker.check(baseOrigin),
            this.sriChecker.check(url),
            this.sensitiveFileChecker.check(baseOrigin),
        ]);
        const [analysisResult, fingerprintResult] = await Promise.all([
            this.analyzer.analyze(httpResult.headers),
            this.techFingerprinter.fingerprint(httpResult.headers, url),
        ]);
        const complianceResult = this.compliance.evaluate(analysisResult.headers, tlsResult, dnsResult, securityFilesResult, fingerprintResult);
        const report = this.report.generate({
            url,
            headers: analysisResult,
            compliance: complianceResult,
            metadata: {
                responseTime: httpResult.responseTime,
                statusCode: httpResult.statusCode,
                analyzedAt: new Date().toISOString(),
            },
            tls: tlsResult,
            dns: dnsResult,
            securityFiles: securityFilesResult,
            sri: sriResult,
            sensitiveFiles: sensitiveFilesResult,
            fingerprint: fingerprintResult,
        });
        return report;
    }
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [http_client_service_1.HttpClientService,
        tls_checker_service_1.TlsCheckerService,
        dns_checker_service_1.DnsCheckerService,
        security_file_checker_service_1.SecurityFileCheckerService,
        sensitive_file_checker_service_1.SensitiveFileCheckerService,
        sri_checker_service_1.SriCheckerService,
        tech_fingerprinter_service_1.TechFingerprinterService,
        analyzer_service_1.AnalyzerService,
        compliance_service_1.ComplianceService,
        report_service_1.ReportService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map
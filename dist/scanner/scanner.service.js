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
const rxjs_1 = require("rxjs");
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
        return this.report.generate({
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
    }
    scanStream(url) {
        const subject = new rxjs_1.Subject();
        this.runScanWithProgress(url, subject).catch((err) => {
            subject.error(err);
        });
        return subject.asObservable();
    }
    emit(subject, event) {
        subject.next(event);
    }
    async runScanWithProgress(url, subject) {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
        const protocol = parsedUrl.protocol;
        const baseOrigin = `${protocol}//${hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;
        this.emit(subject, { stage: 'http', status: 'scanning', message: 'Solicitando headers HTTP...' });
        const httpPromise = this.httpClient.fetch(url).then((r) => {
            this.emit(subject, { stage: 'http', status: 'complete' });
            return r;
        });
        this.emit(subject, { stage: 'tls', status: 'scanning', message: 'Verificando conexión TLS...' });
        const tlsPromise = protocol === 'https:'
            ? this.tlsChecker.check(hostname, port).then((r) => {
                this.emit(subject, { stage: 'tls', status: 'complete' });
                return r;
            })
            : Promise.resolve({
                checked: false, hostname, port,
                error: 'TLS check only applies to HTTPS URLs',
                tlsVersion: null, certificate: null, grade: 0,
            }).then((r) => {
                this.emit(subject, { stage: 'tls', status: 'complete' });
                return r;
            });
        this.emit(subject, { stage: 'dns', status: 'scanning', message: 'Consultando registros DNS...' });
        const dnsPromise = this.dnsChecker.check(hostname).then((r) => {
            this.emit(subject, { stage: 'dns', status: 'complete' });
            return r;
        });
        this.emit(subject, { stage: 'security-files', status: 'scanning', message: 'Buscando archivos de seguridad...' });
        const secFilesPromise = this.securityFileChecker.check(baseOrigin).then((r) => {
            this.emit(subject, { stage: 'security-files', status: 'complete' });
            return r;
        });
        this.emit(subject, { stage: 'sensitive-files', status: 'scanning', message: 'Escaneando archivos sensibles...' });
        const sensFilesPromise = this.sensitiveFileChecker.check(baseOrigin).then((r) => {
            this.emit(subject, { stage: 'sensitive-files', status: 'complete' });
            return r;
        });
        this.emit(subject, { stage: 'sri', status: 'scanning', message: 'Analizando integridad de recursos (SRI)...' });
        const sriPromise = this.sriChecker.check(url).then((r) => {
            this.emit(subject, { stage: 'sri', status: 'complete' });
            return r;
        });
        const httpResult = await httpPromise;
        this.emit(subject, { stage: 'fingerprint', status: 'scanning', message: 'Identificando tecnologías...' });
        const fpPromise = this.techFingerprinter.fingerprint(httpResult.headers, url).then((r) => {
            this.emit(subject, { stage: 'fingerprint', status: 'complete' });
            return r;
        });
        const [tlsResult, dnsResult, securityFilesResult, sriResult, sensitiveFilesResult, fingerprintResult] = await Promise.all([tlsPromise, dnsPromise, secFilesPromise, sriPromise, sensFilesPromise, fpPromise]);
        this.emit(subject, { stage: 'analysis', status: 'scanning', message: 'Analizando resultados...' });
        const analysisResult = await this.analyzer.analyze(httpResult.headers);
        const complianceResult = this.compliance.evaluate(analysisResult.headers, tlsResult, dnsResult, securityFilesResult, fingerprintResult);
        this.emit(subject, { stage: 'analysis', status: 'complete' });
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
        this.emit(subject, { stage: 'complete', status: 'complete', message: 'Escaneo completado' });
        subject.next(report);
        subject.complete();
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
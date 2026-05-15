"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const scanner_controller_1 = require("./scanner.controller");
const scanner_service_1 = require("./scanner.service");
const http_client_service_1 = require("./http-client/http-client.service");
const tls_checker_service_1 = require("./tls/tls-checker.service");
const dns_checker_service_1 = require("./dns/dns-checker.service");
const security_file_checker_service_1 = require("./files/security-file-checker.service");
const sensitive_file_checker_service_1 = require("./files/sensitive-file-checker.service");
const sri_checker_service_1 = require("./content/sri-checker.service");
const tech_fingerprinter_service_1 = require("./fingerprint/tech-fingerprinter.service");
const cve_api_service_1 = require("./fingerprint/cve-api.service");
const export_service_1 = require("../report/export/export.service");
const analyzer_module_1 = require("../analyzer/analyzer.module");
const compliance_module_1 = require("../compliance/compliance.module");
const report_module_1 = require("../report/report.module");
const timeout_config_1 = require("../common/constants/timeout.config");
let ScannerModule = class ScannerModule {
};
exports.ScannerModule = ScannerModule;
exports.ScannerModule = ScannerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: timeout_config_1.TIMEOUTS.HTTP_CLIENT,
                maxRedirects: 5,
            }),
            analyzer_module_1.AnalyzerModule,
            compliance_module_1.ComplianceModule,
            report_module_1.ReportModule,
        ],
        controllers: [scanner_controller_1.ScannerController],
        providers: [
            scanner_service_1.ScannerService, http_client_service_1.HttpClientService, tls_checker_service_1.TlsCheckerService, dns_checker_service_1.DnsCheckerService,
            security_file_checker_service_1.SecurityFileCheckerService, sensitive_file_checker_service_1.SensitiveFileCheckerService, sri_checker_service_1.SriCheckerService,
            tech_fingerprinter_service_1.TechFingerprinterService, cve_api_service_1.CveApiService, export_service_1.ExportService,
        ],
        exports: [scanner_service_1.ScannerService],
    })
], ScannerModule);
//# sourceMappingURL=scanner.module.js.map
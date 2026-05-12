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
const export_service_1 = require("../report/export/export.service");
const analyzer_module_1 = require("../analyzer/analyzer.module");
const compliance_module_1 = require("../compliance/compliance.module");
const report_module_1 = require("../report/report.module");
let ScannerModule = class ScannerModule {
};
exports.ScannerModule = ScannerModule;
exports.ScannerModule = ScannerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: 10000,
                maxRedirects: 5,
            }),
            analyzer_module_1.AnalyzerModule,
            compliance_module_1.ComplianceModule,
            report_module_1.ReportModule,
        ],
        controllers: [scanner_controller_1.ScannerController],
        providers: [scanner_service_1.ScannerService, http_client_service_1.HttpClientService, tls_checker_service_1.TlsCheckerService, export_service_1.ExportService],
        exports: [scanner_service_1.ScannerService],
    })
], ScannerModule);
//# sourceMappingURL=scanner.module.js.map
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
const analyzer_service_1 = require("../analyzer/analyzer.service");
const compliance_service_1 = require("../compliance/compliance.service");
const report_service_1 = require("../report/report.service");
let ScannerService = class ScannerService {
    httpClient;
    analyzer;
    compliance;
    report;
    constructor(httpClient, analyzer, compliance, report) {
        this.httpClient = httpClient;
        this.analyzer = analyzer;
        this.compliance = compliance;
        this.report = report;
    }
    async scan(url) {
        const httpResult = await this.httpClient.fetch(url);
        const analysisResult = this.analyzer.analyze(httpResult.headers);
        const complianceResult = this.compliance.evaluate(analysisResult.headers);
        const report = this.report.generate({
            url,
            headers: analysisResult,
            compliance: complianceResult,
            metadata: {
                responseTime: httpResult.responseTime,
                statusCode: httpResult.statusCode,
                analyzedAt: new Date().toISOString(),
            },
        });
        return report;
    }
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [http_client_service_1.HttpClientService,
        analyzer_service_1.AnalyzerService,
        compliance_service_1.ComplianceService,
        report_service_1.ReportService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map
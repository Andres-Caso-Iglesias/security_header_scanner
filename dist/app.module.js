"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const scanner_module_1 = require("./scanner/scanner.module");
const analyzer_module_1 = require("./analyzer/analyzer.module");
const compliance_module_1 = require("./compliance/compliance.module");
const report_module_1 = require("./report/report.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [scanner_module_1.ScannerModule, analyzer_module_1.AnalyzerModule, compliance_module_1.ComplianceModule, report_module_1.ReportModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
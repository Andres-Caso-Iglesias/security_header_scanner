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
const throttler_1 = require("@nestjs/throttler");
const scanner_module_1 = require("./scanner/scanner.module");
const analyzer_module_1 = require("./analyzer/analyzer.module");
const compliance_module_1 = require("./compliance/compliance.module");
const report_module_1 = require("./report/report.module");
const request_logger_middleware_1 = require("./common/middleware/request-logger.middleware");
const history_module_1 = require("./history/history.module");
const security_config_1 = require("./common/config/security.config");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logger_middleware_1.RequestLoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: security_config_1.SECURITY.RATE_LIMIT_WINDOW_MS,
                    limit: security_config_1.SECURITY.RATE_LIMIT_MAX,
                }]),
            history_module_1.HistoryModule,
            scanner_module_1.ScannerModule,
            analyzer_module_1.AnalyzerModule,
            compliance_module_1.ComplianceModule,
            report_module_1.ReportModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
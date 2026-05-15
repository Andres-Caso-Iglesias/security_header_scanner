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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const rxjs_1 = require("rxjs");
const scanner_service_1 = require("./scanner.service");
const export_service_1 = require("../report/export/export.service");
const scan_request_dto_1 = require("./dto/scan-request.dto");
const export_request_dto_1 = require("./dto/export-request.dto");
const scan_response_dto_1 = require("./dto/scan-response.dto");
const api_key_guard_1 = require("../common/guards/api-key.guard");
let ScannerController = class ScannerController {
    scannerService;
    exportService;
    constructor(scannerService, exportService) {
        this.scannerService = scannerService;
        this.exportService = exportService;
    }
    async scan(body) {
        return this.scannerService.scan(body.url);
    }
    scanStream(url) {
        const stream = this.scannerService.scanStream(url);
        return stream.pipe((0, rxjs_1.map)((data) => ({
            data: JSON.stringify(data),
        })));
    }
    async export(body, res) {
        const result = await this.scannerService.scan(body.url);
        const sanitizedUrl = body.url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.status(common_1.HttpStatus.OK);
        if (body.format === 'json') {
            const json = this.exportService.generateJson(result);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="auditoria-${sanitizedUrl}-${timestamp}.json"`);
            res.send(json);
        }
        else {
            const pdfBuffer = await this.exportService.generatePdf(result);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="auditoria-${sanitizedUrl}-${timestamp}.pdf"`);
            res.send(pdfBuffer);
        }
    }
};
exports.ScannerController = ScannerController;
__decorate([
    (0, common_1.Post)('scan'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Scan a URL for security headers',
        description: 'Fetches HTTP response headers from the target URL and analyzes them against OWASP security best practices. Returns a comprehensive security report with score, compliance mappings, and recommendations.',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBody)({ type: scan_request_dto_1.ScanRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Scan completed successfully',
        type: scan_response_dto_1.ScanResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid URL provided',
    }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'Failed to reach target URL',
    }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scan_request_dto_1.ScanRequestDto]),
    __metadata("design:returntype", Promise)
], ScannerController.prototype, "scan", null);
__decorate([
    (0, common_1.Get)('scan/stream'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stream scan progress via SSE',
        description: 'Returns a Server-Sent Events stream with real-time progress updates as each subsystem completes. The final event contains the complete ScanResult.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'url', required: true, type: String, description: 'Target URL to scan (must include protocol)' }),
    (0, common_1.Sse)(),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScannerController.prototype, "scanStream", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Scan a URL and export the report as PDF or JSON',
        description: 'Performs a full security scan and returns the report as a downloadable file in the requested format (PDF or JSON).',
    }),
    (0, swagger_1.ApiBody)({ type: export_request_dto_1.ExportRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'File downloaded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid URL or format provided',
    }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'Failed to reach target URL',
    }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_request_dto_1.ExportRequestDto, Object]),
    __metadata("design:returntype", Promise)
], ScannerController.prototype, "export", null);
exports.ScannerController = ScannerController = __decorate([
    (0, swagger_1.ApiTags)('Scanner'),
    (0, swagger_1.ApiSecurity)('X-API-Key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService,
        export_service_1.ExportService])
], ScannerController);
//# sourceMappingURL=scanner.controller.js.map
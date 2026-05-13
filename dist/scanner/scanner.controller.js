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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const swagger_1 = require("@nestjs/swagger");
const scanner_service_1 = require("./scanner.service");
const export_service_1 = require("../report/export/export.service");
const scan_request_dto_1 = require("./dto/scan-request.dto");
const export_request_dto_1 = require("./dto/export-request.dto");
const scan_response_dto_1 = require("./dto/scan-response.dto");
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
    (0, common_1.Post)('export'),
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
    __metadata("design:paramtypes", [export_request_dto_1.ExportRequestDto, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ScannerController.prototype, "export", null);
exports.ScannerController = ScannerController = __decorate([
    (0, swagger_1.ApiTags)('Scanner'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService,
        export_service_1.ExportService])
], ScannerController);
//# sourceMappingURL=scanner.controller.js.map
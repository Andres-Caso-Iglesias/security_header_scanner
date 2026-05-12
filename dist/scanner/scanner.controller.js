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
const scanner_service_1 = require("./scanner.service");
const scan_request_dto_1 = require("./dto/scan-request.dto");
const scan_response_dto_1 = require("./dto/scan-response.dto");
let ScannerController = class ScannerController {
    scannerService;
    constructor(scannerService) {
        this.scannerService = scannerService;
    }
    async scan(body) {
        return this.scannerService.scan(body.url);
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
exports.ScannerController = ScannerController = __decorate([
    (0, swagger_1.ApiTags)('Scanner'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [scanner_service_1.ScannerService])
], ScannerController);
//# sourceMappingURL=scanner.controller.js.map
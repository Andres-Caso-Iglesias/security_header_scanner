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
exports.ScanResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ScanResponseDto {
    url;
    timestamp;
    score;
    grade;
    headers;
    compliance;
    recommendations;
    metadata;
    tls;
}
exports.ScanResponseDto = ScanResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scanned URL' }),
    __metadata("design:type", String)
], ScanResponseDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp of the scan' }),
    __metadata("design:type", String)
], ScanResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Overall security score (0-100)' }),
    __metadata("design:type", Number)
], ScanResponseDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Letter grade (A-F)' }),
    __metadata("design:type", String)
], ScanResponseDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Per-header analysis results', type: [Object] }),
    __metadata("design:type", Array)
], ScanResponseDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Compliance framework mappings', type: [Object] }),
    __metadata("design:type", Array)
], ScanResponseDto.prototype, "compliance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Actionable recommendations', type: [String] }),
    __metadata("design:type", Array)
], ScanResponseDto.prototype, "recommendations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scan metadata' }),
    __metadata("design:type", Object)
], ScanResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'TLS/SSL certificate and protocol information' }),
    __metadata("design:type", Object)
], ScanResponseDto.prototype, "tls", void 0);
//# sourceMappingURL=scan-response.dto.js.map
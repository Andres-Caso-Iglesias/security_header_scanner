"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const ssrf_guard_1 = require("../guards/ssrf.guard");
let UrlValidationPipe = class UrlValidationPipe {
    allowedProtocols = ['http:', 'https:'];
    maxUrlLength = 2048;
    transform(value) {
        if (!value) {
            throw new common_1.BadRequestException('URL is required');
        }
        if (value.length > this.maxUrlLength) {
            throw new common_1.BadRequestException(`URL must not exceed ${this.maxUrlLength} characters`);
        }
        try {
            const url = new URL(value);
            if (!this.allowedProtocols.includes(url.protocol)) {
                throw new common_1.BadRequestException('Only HTTP and HTTPS URLs are allowed');
            }
            if (!url.hostname) {
                throw new common_1.BadRequestException('URL must have a valid hostname');
            }
            if ((0, ssrf_guard_1.isBlockedHostname)(url.hostname)) {
                throw new common_1.BadRequestException(`Access to ${url.hostname} is not allowed`);
            }
            if ((0, ssrf_guard_1.isPrivateIp)(url.hostname)) {
                throw new common_1.BadRequestException(`Access to private IP address ${url.hostname} is not allowed`);
            }
            if (!url.hostname.includes('.')) {
                throw new common_1.BadRequestException('URL must be a fully qualified domain name');
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Invalid URL format');
        }
        return value;
    }
};
exports.UrlValidationPipe = UrlValidationPipe;
exports.UrlValidationPipe = UrlValidationPipe = __decorate([
    (0, common_1.Injectable)()
], UrlValidationPipe);
//# sourceMappingURL=url-validation.pipe.js.map
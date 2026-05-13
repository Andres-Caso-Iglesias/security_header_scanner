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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const axios_2 = require("axios");
let HttpClientService = class HttpClientService {
    httpService;
    userAgent = 'AuditoriaWeb-Scanner/1.0 (Security Headers Analyzer)';
    constructor(httpService) {
        this.httpService = httpService;
    }
    async fetch(url) {
        const startTime = Date.now();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    Accept: '*/*',
                },
                responseType: 'arraybuffer',
                decompress: true,
                validateStatus: () => true,
            }));
            const responseTime = Date.now() - startTime;
            const rawHeaders = {};
            if (response.headers) {
                for (const [key, value] of Object.entries(response.headers)) {
                    rawHeaders[key] = String(value);
                }
            }
            return {
                headers: rawHeaders,
                statusCode: response.status,
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            if (error instanceof axios_2.AxiosError) {
                const statusCode = common_1.HttpStatus.BAD_GATEWAY;
                let message;
                let errorCode;
                switch (error.code) {
                    case 'ECONNABORTED':
                        message = `Request to ${url} timed out`;
                        errorCode = 'Gateway Timeout';
                        break;
                    case 'ENOTFOUND':
                    case 'EAI_AGAIN':
                        message = `Could not resolve hostname for ${url}`;
                        errorCode = 'DNS Resolution Failed';
                        break;
                    case 'ECONNREFUSED':
                        message = `Connection refused by ${url}`;
                        errorCode = 'Connection Refused';
                        break;
                    case 'ECONNRESET':
                        message = `Connection was reset by ${url}`;
                        errorCode = 'Connection Reset';
                        break;
                    case 'ERR_CERT_DATE_INVALID':
                    case 'CERT_HAS_EXPIRED':
                        message = `SSL certificate error for ${url}`;
                        errorCode = 'SSL Certificate Error';
                        break;
                    default:
                        message = `Failed to fetch ${url}: ${error.message}`;
                        errorCode = 'Fetch Error';
                }
                throw new common_1.HttpException({ statusCode, message, error: errorCode }, statusCode);
            }
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Failed to fetch ${url}: ${error.message}`,
                error: 'Internal Server Error',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.HttpClientService = HttpClientService;
exports.HttpClientService = HttpClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object])
], HttpClientService);
//# sourceMappingURL=http-client.service.js.map
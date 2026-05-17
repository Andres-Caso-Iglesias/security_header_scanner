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
exports.AnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const header_weights_1 = require("../common/constants/header-weights");
const score_calculator_1 = require("./score-calculator");
const csp_checker_1 = require("./checkers/csp.checker");
const hsts_checker_1 = require("./checkers/hsts.checker");
const x_frame_options_checker_1 = require("./checkers/x-frame-options.checker");
const x_content_type_options_checker_1 = require("./checkers/x-content-type-options.checker");
const referrer_policy_checker_1 = require("./checkers/referrer-policy.checker");
const permissions_policy_checker_1 = require("./checkers/permissions-policy.checker");
const cache_control_checker_1 = require("./checkers/cache-control.checker");
const cors_checker_1 = require("./checkers/cors.checker");
const set_cookie_checker_1 = require("./checkers/set-cookie.checker");
const corp_checker_1 = require("./checkers/corp.checker");
const coop_checker_1 = require("./checkers/coop.checker");
const coep_checker_1 = require("./checkers/coep.checker");
const x_powered_by_checker_1 = require("./checkers/x-powered-by.checker");
const server_header_checker_1 = require("./checkers/server-header.checker");
const x_xss_protection_checker_1 = require("./checkers/x-xss-protection.checker");
let AnalyzerService = class AnalyzerService {
    scoreCalculator;
    checkers;
    constructor(scoreCalculator, cspChecker, hstsChecker, xFrameOptionsChecker, xContentTypeOptionsChecker, referrerPolicyChecker, permissionsPolicyChecker, cacheControlChecker, corsChecker, setCookieChecker, corpChecker, coopChecker, coepChecker, xPoweredByChecker, serverHeaderChecker, xXssProtectionChecker) {
        this.scoreCalculator = scoreCalculator;
        this.checkers = [
            cspChecker,
            hstsChecker,
            xFrameOptionsChecker,
            xContentTypeOptionsChecker,
            referrerPolicyChecker,
            permissionsPolicyChecker,
            cacheControlChecker,
            corsChecker,
            setCookieChecker,
            corpChecker,
            coopChecker,
            coepChecker,
            xPoweredByChecker,
            serverHeaderChecker,
            xXssProtectionChecker,
        ];
    }
    analyze(rawHeaders) {
        const normalizedHeaders = {};
        for (const [key, value] of Object.entries(rawHeaders)) {
            normalizedHeaders[key.toLowerCase()] = value;
        }
        const results = [];
        for (const config of header_weights_1.HEADER_WEIGHTS) {
            const headerNameLower = config.headerName.toLowerCase();
            const headerValue = normalizedHeaders[headerNameLower];
            const checker = this.checkers.find((c) => c.name === config.name);
            if (checker) {
                results.push(checker.analyze(headerValue));
            }
            else {
                results.push({
                    header: config.headerName,
                    present: headerValue !== undefined,
                    value: headerValue ?? null,
                    expected: config.expectedValue,
                    grade: headerValue !== undefined ? 0.5 : 0,
                    severity: config.severity,
                    weight: config.weight,
                    finding: headerValue !== undefined
                        ? `${config.headerName} is present but could not be fully analyzed`
                        : `${config.headerName} is missing`,
                    recommendation: `Implement ${config.headerName} header: ${config.expectedValue}`,
                });
            }
        }
        const { score, grade } = this.scoreCalculator.calculate(results);
        return {
            headers: results,
            score,
            grade,
        };
    }
};
exports.AnalyzerService = AnalyzerService;
exports.AnalyzerService = AnalyzerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [score_calculator_1.ScoreCalculator,
        csp_checker_1.CspChecker,
        hsts_checker_1.HstsChecker,
        x_frame_options_checker_1.XFrameOptionsChecker,
        x_content_type_options_checker_1.XContentTypeOptionsChecker,
        referrer_policy_checker_1.ReferrerPolicyChecker,
        permissions_policy_checker_1.PermissionsPolicyChecker,
        cache_control_checker_1.CacheControlChecker,
        cors_checker_1.CorsChecker,
        set_cookie_checker_1.SetCookieChecker,
        corp_checker_1.CorpChecker,
        coop_checker_1.CoopChecker,
        coep_checker_1.CoepChecker,
        x_powered_by_checker_1.XPoweredByChecker,
        server_header_checker_1.ServerHeaderChecker,
        x_xss_protection_checker_1.XXssProtectionChecker])
], AnalyzerService);
//# sourceMappingURL=analyzer.service.js.map
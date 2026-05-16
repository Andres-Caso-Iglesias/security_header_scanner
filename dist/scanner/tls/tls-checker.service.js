"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var TlsCheckerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TlsCheckerService = void 0;
const common_1 = require("@nestjs/common");
const tls = __importStar(require("tls"));
const timeout_config_1 = require("../../common/constants/timeout.config");
const ssrf_guard_1 = require("../../common/guards/ssrf.guard");
let TlsCheckerService = TlsCheckerService_1 = class TlsCheckerService {
    logger = new common_1.Logger(TlsCheckerService_1.name);
    timeoutMs = timeout_config_1.TIMEOUTS.TLS;
    defaultPort = 443;
    async check(hostname, port) {
        const targetPort = port ?? this.defaultPort;
        try {
            await (0, ssrf_guard_1.resolveAndCheckHostname)(hostname);
        }
        catch (error) {
            this.logger.warn(`SSRF check failed for ${hostname}:${targetPort} — ${error.message}`);
            return {
                checked: true,
                hostname,
                port: targetPort,
                error: error.message,
                tlsVersion: null,
                certificate: null,
                grade: 0,
            };
        }
        try {
            return await this.performTlsCheck(hostname, targetPort);
        }
        catch (error) {
            this.logger.warn(`TLS check failed for ${hostname}:${targetPort} — ${error.message}`);
            return {
                checked: true,
                hostname,
                port: targetPort,
                error: error.message,
                tlsVersion: null,
                certificate: null,
                grade: 0,
            };
        }
    }
    performTlsCheck(hostname, port) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const socket = tls.connect(port, hostname, {
                servername: hostname,
                rejectUnauthorized: false,
            });
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new Error('TLS connection timed out'));
            }, this.timeoutMs);
            socket.on('connect', () => {
            });
            socket.on('secureConnect', () => {
                clearTimeout(timeout);
                const tlsVersion = socket.getProtocol();
                const cert = socket.getPeerCertificate(true);
                if (!cert || Object.keys(cert).length === 0) {
                    socket.end();
                    reject(new Error('No peer certificate received'));
                    return;
                }
                const certificate = this.parseCertificate(cert, hostname);
                const grade = this.calculateTlsGrade(tlsVersion, certificate);
                const elapsed = Date.now() - startTime;
                socket.end();
                resolve({
                    checked: true,
                    hostname,
                    port,
                    error: null,
                    tlsVersion,
                    certificate,
                    grade,
                });
            });
            socket.on('error', (err) => {
                clearTimeout(timeout);
                socket.destroy();
                if (err.code === 'ECONNREFUSED') {
                    reject(new Error(`Connection refused on port ${port}`));
                }
                else if (err.code === 'ENOTFOUND') {
                    reject(new Error(`Could not resolve hostname: ${hostname}`));
                }
                else if (err.code === 'ECONNRESET') {
                    reject(new Error('Connection reset during TLS handshake'));
                }
                else {
                    reject(err);
                }
            });
            socket.on('close', () => {
                clearTimeout(timeout);
            });
        });
    }
    parseCertificate(cert, hostname) {
        const now = new Date();
        const validTo = new Date(cert.valid_to);
        const expiresInDays = Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const expired = now > validTo || now < new Date(cert.valid_from);
        const subjectParts = cert.subject ? Object.entries(cert.subject).map(([k, v]) => `${k}=${v}`) : [];
        const issuerParts = cert.issuer ? Object.entries(cert.issuer).map(([k, v]) => `${k}=${v}`) : [];
        const subjectStr = subjectParts.join(', ');
        const issuerStr = issuerParts.join(', ');
        const selfSigned = subjectStr === issuerStr;
        const cn = typeof cert.subject?.CN === 'string' ? cert.subject.CN : '';
        const isWildcard = cn.startsWith('*.') || (cert.subjectaltname?.includes('*.') ?? false);
        const san = [];
        if (cert.subjectaltname) {
            const entries = cert.subjectaltname.split(', ');
            for (const entry of entries) {
                if (entry.startsWith('DNS:')) {
                    san.push(entry.slice(4));
                }
            }
        }
        return {
            subject: subjectStr,
            issuer: issuerStr,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            expiresInDays,
            expired,
            selfSigned,
            wildcard: isWildcard,
            fingerprint: cert.fingerprint256 || '',
            serialNumber: cert.serialNumber || '',
            san,
        };
    }
    calculateTlsGrade(protocol, cert) {
        let tlsScore = 0;
        if (!protocol) {
            tlsScore = 0;
        }
        else if (protocol.startsWith('TLSv1.3')) {
            tlsScore = 1.0;
        }
        else if (protocol.startsWith('TLSv1.2')) {
            tlsScore = 0.8;
        }
        else if (protocol.startsWith('TLSv1.1')) {
            tlsScore = 0.3;
        }
        else if (protocol.startsWith('TLSv1')) {
            tlsScore = 0;
        }
        else {
            tlsScore = 0.5;
        }
        let certScore = 0;
        if (cert.expired) {
            certScore = 0;
        }
        else if (cert.selfSigned) {
            certScore = 0.3;
        }
        else if (cert.wildcard) {
            certScore = 0.7;
        }
        else {
            certScore = 1.0;
        }
        if (!cert.expired && cert.expiresInDays < 30) {
            certScore = Math.min(certScore, 0.5);
        }
        else if (!cert.expired && cert.expiresInDays < 90) {
            certScore = Math.min(certScore, 0.8);
        }
        return Math.round((tlsScore * 0.5 + certScore * 0.5) * 100) / 100;
    }
};
exports.TlsCheckerService = TlsCheckerService;
exports.TlsCheckerService = TlsCheckerService = TlsCheckerService_1 = __decorate([
    (0, common_1.Injectable)()
], TlsCheckerService);
//# sourceMappingURL=tls-checker.service.js.map
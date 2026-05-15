import { Injectable, Logger } from '@nestjs/common';
import * as tls from 'tls';
import * as net from 'net';
import type { TlsInfo, CertificateInfo } from '../../common/interfaces/tls-info.interface';
import { TIMEOUTS } from '../../common/constants/timeout.config';

@Injectable()
export class TlsCheckerService {
  private readonly logger = new Logger(TlsCheckerService.name);
  private readonly timeoutMs = TIMEOUTS.TLS;
  private readonly defaultPort = 443;

  async check(hostname: string, port?: number): Promise<TlsInfo> {
    const targetPort = port ?? this.defaultPort;

    try {
      return await this.performTlsCheck(hostname, targetPort);
    } catch (error) {
      this.logger.warn(`TLS check failed for ${hostname}:${targetPort} — ${(error as Error).message}`);
      return {
        checked: true,
        hostname,
        port: targetPort,
        error: (error as Error).message,
        tlsVersion: null,
        certificate: null,
        grade: 0,
      };
    }
  }

  private performTlsCheck(hostname: string, port: number): Promise<TlsInfo> {
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
        // Handshake is complete at this point
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

        if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
          reject(new Error(`Connection refused on port ${port}`));
        } else if ((err as NodeJS.ErrnoException).code === 'ENOTFOUND') {
          reject(new Error(`Could not resolve hostname: ${hostname}`));
        } else if ((err as NodeJS.ErrnoException).code === 'ECONNRESET') {
          reject(new Error('Connection reset during TLS handshake'));
        } else {
          reject(err);
        }
      });

      socket.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  private parseCertificate(cert: tls.PeerCertificate, hostname: string): CertificateInfo {
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

    const san: string[] = [];
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

  private calculateTlsGrade(protocol: string | null | undefined, cert: CertificateInfo): number {
    // TLS version score (50% weight)
    let tlsScore = 0;
    if (!protocol) {
      tlsScore = 0;
    } else if (protocol.startsWith('TLSv1.3')) {
      tlsScore = 1.0;
    } else if (protocol.startsWith('TLSv1.2')) {
      tlsScore = 0.8;
    } else if (protocol.startsWith('TLSv1.1')) {
      tlsScore = 0.3;
    } else if (protocol.startsWith('TLSv1')) {
      tlsScore = 0;
    } else {
      tlsScore = 0.5;
    }

    // Certificate score (50% weight)
    let certScore = 0;
    if (cert.expired) {
      certScore = 0;
    } else if (cert.selfSigned) {
      certScore = 0.3;
    } else if (cert.wildcard) {
      certScore = 0.7;
    } else {
      certScore = 1.0;
    }

    // Additional: penalize if expiring soon
    if (!cert.expired && cert.expiresInDays < 30) {
      certScore = Math.min(certScore, 0.5);
    } else if (!cert.expired && cert.expiresInDays < 90) {
      certScore = Math.min(certScore, 0.8);
    }

    return Math.round((tlsScore * 0.5 + certScore * 0.5) * 100) / 100;
  }
}

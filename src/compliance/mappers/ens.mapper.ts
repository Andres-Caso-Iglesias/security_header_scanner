import { Injectable } from '@nestjs/common';
import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { SecurityFileInfo } from '../../common/interfaces/security-file-info.interface';
import type { TechFingerprintInfo } from '../../common/interfaces/fingerprint-info.interface';
import type { ComplianceFinding } from '../interfaces/compliance-finding.interface';

@Injectable()
export class EnsMapper {
  private readonly version = 'RD 311/2022';

  map(
    headers: HeaderResult[],
    tls?: TlsInfo,
    dns?: DnsInfo,
    securityFiles?: SecurityFileInfo,
    fingerprint?: TechFingerprintInfo,
  ): ComplianceFinding[] {
    return [
      this.mapOpAcc2(headers),
      this.mapOpExp5(headers),
      this.mapOpPl3(headers),
      this.mapOpMon2(dns),
      this.mapOpCont2(tls),
      this.mapOrgOrganizacion(securityFiles),
      this.mapOpVuln(fingerprint),
    ];
  }

  // op.acc.2 - Access control
  private mapOpAcc2(headers: HeaderResult[]): ComplianceFinding {
    const cors = headers.find((h) => h.header === 'Access-Control-Allow-Origin');
    const coop = headers.find((h) => h.header === 'Cross-Origin-Opener-Policy');
    const cookies = headers.find((h) => h.header === 'Set-Cookie');
    const issues: string[] = [];

    if (cors && cors.grade < 1.0) issues.push('CORS no restrictivo');
    if (coop && coop.grade < 0.6) issues.push('Aislamiento cross-origin debil');
    if (cookies && cookies.grade < 1.0) issues.push('Cookies sin flags de seguridad');

    const status = issues.length === 0 ? 'compliant' : 'non_compliant';
    return {
      control: 'op.acc.2 - Control de acceso',
      status,
      relatedHeaders: ['Access-Control-Allow-Origin', 'Cross-Origin-Opener-Policy', 'Set-Cookie'],
      description: issues.length > 0 ? issues.join('; ') : 'Controles de acceso adecuados',
      recommendation: issues.length > 0
        ? 'Restringir CORS a origenes especificos, fortalecer aislamiento cross-origin y asegurar cookies'
        : 'Mantener configuracion actual',
    };
  }

  // op.exp.5 - Information leakage
  private mapOpExp5(headers: HeaderResult[]): ComplianceFinding {
    const xpb = headers.find((h) => h.header === 'X-Powered-By');
    const server = headers.find((h) => h.header === 'Server');
    const infoLeaks = [xpb, server].filter((h) => h && h.present && h.grade < 0.5);

    return {
      control: 'op.exp.5 - Proteccion de informacion',
      status: infoLeaks.length === 0 ? 'compliant' : 'non_compliant',
      relatedHeaders: infoLeaks.map((h) => h!.header),
      description: infoLeaks.length > 0
        ? `Cabeceras que revelan tecnologia: ${infoLeaks.map((h) => h!.header).join(', ')}`
        : 'No se detecta fuga de informacion tecnologica',
      recommendation: infoLeaks.length > 0
        ? 'Eliminar o minimizar cabeceras que revelen informacion del servidor'
        : 'Mantener configuracion actual',
    };
  }

  // op.pl.3 - Perimeter security
  private mapOpPl3(headers: HeaderResult[]): ComplianceFinding {
    const csp = headers.find((h) => h.header === 'Content-Security-Policy');
    const hsts = headers.find((h) => h.header === 'Strict-Transport-Security');
    const xfo = headers.find((h) => h.header === 'X-Frame-Options');
    const missing: string[] = [];

    if (!csp || csp.grade < 0.5) missing.push('CSP');
    if (!hsts || hsts.grade < 0.5) missing.push('HSTS');
    if (!xfo || xfo.grade < 0.5) missing.push('X-Frame-Options');

    const status = missing.length === 0 ? 'compliant' : missing.length <= 1 ? 'partially_compliant' : 'non_compliant';
    return {
      control: 'op.pl.3 - Seguridad perimetral',
      status,
      relatedHeaders: ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options'],
      description: missing.length > 0
        ? `Cabeceras de seguridad perimetral ausentes o debiles: ${missing.join(', ')}`
        : 'Seguridad perimetral correctamente configurada',
      recommendation: missing.length > 0
        ? 'Implementar CSP, HSTS y X-Frame-Options para fortalecer el perimetro'
        : 'Mantener configuracion actual',
    };
  }

  // op.mon.2 - Monitoring
  private mapOpMon2(dns?: DnsInfo): ComplianceFinding {
    const dmarcOk = dns?.dmarc?.present && dns.dmarc.grade >= 0.7;
    return {
      control: 'op.mon.2 - Monitorizacion',
      status: dmarcOk ? 'compliant' : 'partially_compliant',
      relatedHeaders: [],
      description: dmarcOk
        ? 'DMARC configurado con politicas de monitoreo'
        : 'No se detectan mecanismos de monitorizacion de correo (DMARC)',
      recommendation: dmarcOk
        ? 'Mantener monitoreo DMARC'
        : 'Configurar DMARC con rua para recibir informes de autenticacion de correo',
    };
  }

  // op.cont.2 - Continuity (TLS cert expiry)
  private mapOpCont2(tls?: TlsInfo): ComplianceFinding {
    if (!tls || !tls.checked) {
      return {
        control: 'op.cont.2 - Continuidad de servicio',
        status: 'not_applicable',
        relatedHeaders: [],
        description: 'No se pudo verificar TLS',
        recommendation: 'Asegurar disponibilidad del servicio',
      };
    }
    const expired = tls.certificate?.expired;
    const expiresSoon = tls.certificate && tls.certificate.expiresInDays >= 0 && tls.certificate.expiresInDays < 30;
    return {
      control: 'op.cont.2 - Continuidad de servicio',
      status: expired ? 'non_compliant' : expiresSoon ? 'partially_compliant' : 'compliant',
      relatedHeaders: [],
      description: expired
        ? `Certificado TLS expirado el ${tls.certificate?.validTo}`
        : expiresSoon
          ? `Certificado TLS expira en ${tls.certificate?.expiresInDays} dias`
          : 'Certificado TLS en periodo de validez',
      recommendation: expired
        ? 'RENOVAR EL CERTIFICADO INMEDIATAMENTE'
        : expiresSoon
          ? 'Planificar renovacion del certificado antes de su vencimiento'
          : 'Mantener renovacion periodica de certificados',
    };
  }

  // org.organizacion - Security framework
  private mapOrgOrganizacion(securityFiles?: SecurityFileInfo): ComplianceFinding {
    const hasSecurityTxt = securityFiles?.securityTxt?.present;
    return {
      control: 'org.organizacion - Marco organizativo',
      status: hasSecurityTxt ? 'compliant' : 'partially_compliant',
      relatedHeaders: [],
      description: hasSecurityTxt
        ? 'security.txt presente para reporte de vulnerabilidades (RFC 9116)'
        : 'No se ha publicado security.txt para canal de divulgacion de vulnerabilidades',
      recommendation: hasSecurityTxt
        ? 'Mantener security.txt actualizado'
        : 'Publicar security.txt en /.well-known/security.txt segun RFC 9116',
    };
  }

  // op.vuln - Vulnerability management (fingerprinting)
  private mapOpVuln(fingerprint?: TechFingerprintInfo): ComplianceFinding {
    const cves = fingerprint?.cves || [];
    return {
      control: 'op.vuln - Gestion de vulnerabilidades',
      status: cves.length === 0 ? 'compliant' : cves.some((c) => c.severity === 'critical') ? 'non_compliant' : 'partially_compliant',
      relatedHeaders: [],
      description: cves.length > 0
        ? `${cves.length} CVE(s) detectados en tecnologias del servidor`
        : 'No se detectaron vulnerabilidades conocidas en las tecnologias identificadas',
      recommendation: cves.length > 0
        ? 'Actualizar las tecnologias detectadas a versiones parcheadas. CVEs: ' + cves.map((c) => c.id).join(', ')
        : 'Mantener las tecnologias actualizadas',
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { HeaderResult } from '../../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../../common/interfaces/dns-info.interface';
import type { SecurityFileInfo } from '../../common/interfaces/security-file-info.interface';
import type { TechFingerprintInfo } from '../../common/interfaces/fingerprint-info.interface';
import type { ComplianceFinding } from '../interfaces/compliance-finding.interface';

@Injectable()
export class Iso27001Mapper {
  private readonly version = '2022';

  map(
    headers: HeaderResult[],
    tls?: TlsInfo,
    dns?: DnsInfo,
    securityFiles?: SecurityFileInfo,
    fingerprint?: TechFingerprintInfo,
  ): ComplianceFinding[] {
    return [
      this.mapA5Policies(securityFiles),
      this.mapA8AssetManagement(headers),
      this.mapA9AccessControl(headers),
      this.mapA10Cryptography(headers, tls),
      this.mapA12Vulnerability(fingerprint),
      this.mapA13NetworkSecurity(headers),
      this.mapA13InformationTransfer(tls),
      this.mapA14SecureDevelopment(headers),
      this.mapA16IncidentResponse(headers, dns),
      this.mapA18Compliance(headers, tls, dns),
    ];
  }

  // A.5.1 - Information security policies
  private mapA5Policies(securityFiles?: SecurityFileInfo): ComplianceFinding {
    const hasSecurityTxt = securityFiles?.securityTxt?.present;
    return {
      control: 'A.5.1 - Politicas de seguridad de la informacion',
      status: hasSecurityTxt ? 'compliant' : 'partially_compliant',
      relatedHeaders: [],
      description: hasSecurityTxt
        ? 'Politica de divulgacion publicada via security.txt'
        : 'No se ha publicado una politica de divulgacion de vulnerabilidades',
      recommendation: hasSecurityTxt
        ? 'Mantener la politica actualizada'
        : 'Publicar security.txt con informacion de contacto y politica de divulgacion',
    };
  }

  // A.8.1 - Asset management (robots.txt reveals sensitive paths)
  private mapA8AssetManagement(headers: HeaderResult[]): ComplianceFinding {
    return {
      control: 'A.8.1 - Inventario de activos',
      status: 'not_applicable',
      relatedHeaders: [],
      description: 'La gestion de activos se evalua mediante robots.txt y archivos expuestos en otras secciones',
      recommendation: 'Mantener un inventario actualizado de activos y revisar rutas expuestas en robots.txt',
    };
  }

  // A.9.1 - Access control
  private mapA9AccessControl(headers: HeaderResult[]): ComplianceFinding {
    const cors = headers.find((h) => h.header === 'Access-Control-Allow-Origin');
    const coop = headers.find((h) => h.header === 'Cross-Origin-Opener-Policy');
    const issues: string[] = [];

    if (cors && cors.grade < 1.0) issues.push('CORS no restrictivo');
    if (coop && coop.grade < 0.6) issues.push('Aislamiento cross-origin debil');

    return {
      control: 'A.9.1 - Control de acceso',
      status: issues.length === 0 ? 'compliant' : 'non_compliant',
      relatedHeaders: ['Access-Control-Allow-Origin', 'Cross-Origin-Opener-Policy'],
      description: issues.length > 0 ? issues.join('; ') : 'Controles de acceso adecuados',
      recommendation: issues.length > 0
        ? 'Restringir CORS y fortalecer aislamiento cross-origin'
        : 'Mantener configuracion actual',
    };
  }

  // A.10.1 - Cryptography
  private mapA10Cryptography(headers: HeaderResult[], tls?: TlsInfo): ComplianceFinding {
    const hsts = headers.find((h) => h.header === 'Strict-Transport-Security');
    const hasHsts = hsts && hsts.grade > 0;
    const strongHsts = hsts && hsts.grade >= 0.6;

    const tlsVersion = tls?.tlsVersion;
    const certExpired = tls?.certificate?.expired;
    const strongTls = tlsVersion && tlsVersion >= 'TLSv1.2';

    const issues: string[] = [];
    if (!hasHsts) issues.push('HSTS no configurado');
    if (certExpired) issues.push('Certificado TLS expirado');
    if (tlsVersion && !strongTls) issues.push(`Version TLS obsoleta: ${tlsVersion}`);

    const status = issues.length === 0 && strongHsts ? 'compliant' : issues.length > 1 ? 'non_compliant' : 'partially_compliant';
    return {
      control: 'A.10.1 - Controles criptograficos',
      status,
      relatedHeaders: ['Strict-Transport-Security'],
      description: issues.length > 0
        ? `Problemas criptograficos: ${issues.join('; ')}`
        : 'Controles criptograficos adecuados (HSTS + TLS)',
      recommendation: issues.length > 0
        ? 'Configurar HSTS con max-age >= 31536000, asegurar TLS 1.2+ y certificado valido'
        : 'Mantener configuracion criptografica',
    };
  }

  // A.12.6 - Technical vulnerability management
  private mapA12Vulnerability(fingerprint?: TechFingerprintInfo): ComplianceFinding {
    const cves = fingerprint?.cves || [];
    return {
      control: 'A.12.6 - Gestion de vulnerabilidades tecnicas',
      status: cves.length === 0 ? 'compliant' : 'non_compliant',
      relatedHeaders: [],
      description: cves.length > 0
        ? `${cves.length} vulnerabilidad(es) conocida(s) detectada(s): ${cves.map((c) => c.id).join(', ')}`
        : 'No se detectaron vulnerabilidades conocidas',
      recommendation: cves.length > 0
        ? 'Aplicar parches de seguridad a las tecnologias afectadas'
        : 'Continuar con el proceso de parcheado regular',
    };
  }

  // A.13.1 - Network security
  private mapA13NetworkSecurity(headers: HeaderResult[]): ComplianceFinding {
    const csp = headers.find((h) => h.header === 'Content-Security-Policy');
    const xfo = headers.find((h) => h.header === 'X-Frame-Options');
    const xcto = headers.find((h) => h.header === 'X-Content-Type-Options');

    const missing: string[] = [];
    if (!csp || csp.grade < 0.5) missing.push('CSP');
    if (!xfo || xfo.grade < 0.5) missing.push('X-Frame-Options');
    if (!xcto || xcto.grade < 0.5) missing.push('X-Content-Type-Options');

    return {
      control: 'A.13.1 - Seguridad de redes',
      status: missing.length === 0 ? 'compliant' : missing.length <= 1 ? 'partially_compliant' : 'non_compliant',
      relatedHeaders: ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options'],
      description: missing.length > 0
        ? `Cabeceras de seguridad de red ausentes: ${missing.join(', ')}`
        : 'Seguridad de red correctamente configurada',
      recommendation: missing.length > 0
        ? 'Implementar CSP, X-Frame-Options y X-Content-Type-Options'
        : 'Mantener configuracion actual',
    };
  }

  // A.13.2 - Information transfer (TLS)
  private mapA13InformationTransfer(tls?: TlsInfo): ComplianceFinding {
    const version = tls?.tlsVersion;
    const certValid = tls?.certificate && !tls.certificate.expired && !tls.certificate.selfSigned;

    let status: ComplianceFinding['status'];
    let desc: string;
    let rec: string;

    if (tls?.error === 'TLS check only applies to HTTPS URLs') {
      status = 'non_compliant';
      desc = 'Transferencia de informacion sin cifrar (HTTP)';
      rec = 'Migrar a HTTPS para proteger la transferencia de datos';
    } else if (version && version >= 'TLSv1.2' && certValid) {
      status = 'compliant';
      desc = `Transferencia cifrada con ${version} y certificado valido`;
      rec = 'Mantener configuracion actual';
    } else if (version && version >= 'TLSv1.2') {
      status = 'partially_compliant';
      desc = 'TLS adecuado pero problema con el certificado';
      rec = 'Resolver problemas del certificado SSL';
    } else {
      status = 'non_compliant';
      desc = `Version TLS inadecuada: ${version || 'no disponible'}`;
      rec = 'Actualizar a TLS 1.2 o superior';
    }

    return {
      control: 'A.13.2 - Transferencia de informacion',
      status,
      relatedHeaders: [],
      description: desc,
      recommendation: rec,
    };
  }

  // A.14.2 - Secure development (SRI)
  private mapA14SecureDevelopment(headers: HeaderResult[]): ComplianceFinding {
    return {
      control: 'A.14.2 - Desarrollo seguro',
      status: 'not_applicable',
      relatedHeaders: [],
      description: 'La verificacion de SRI (Subresource Integrity) se evalua por separado',
      recommendation: 'Implementar SRI en todos los recursos cargados desde CDNs o terceros',
    };
  }

  // A.16.1 - Incident management
  private mapA16IncidentResponse(headers: HeaderResult[], dns?: DnsInfo): ComplianceFinding {
    const csp = headers.find((h) => h.header === 'Content-Security-Policy');
    const hasReporting = csp?.value && (/\breport-(to|uri)\b/i.test(csp.value) || /\breporting-endpoints?\b/i.test(csp.value));
    const hasDmarc = dns?.dmarc?.present && dns.dmarc.grade >= 0.7;

    const mechanisms: string[] = [];
    if (hasReporting) mechanisms.push('CSP reporting');
    if (hasDmarc) mechanisms.push('DMARC reporting');

    return {
      control: 'A.16.1 - Gestion de incidentes',
      status: mechanisms.length >= 2 ? 'compliant' : mechanisms.length === 1 ? 'partially_compliant' : 'partially_compliant',
      relatedHeaders: ['Content-Security-Policy'],
      description: mechanisms.length > 0
        ? `Mecanismos de deteccion: ${mechanisms.join(', ')}`
        : 'No se detectaron mecanismos de notificacion de incidentes',
      recommendation: mechanisms.length < 2
        ? 'Configurar CSP reporting y DMARC para mejorar la deteccion de incidentes'
        : 'Mantener los mecanismos de deteccion actuales',
    };
  }

  // A.18.1 - Compliance
  private mapA18Compliance(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceFinding {
    const missingCritical = headers.filter((h) => h.severity === 'critical' && h.grade < 0.5);
    const certExpired = tls?.certificate?.expired;
    const dnsMissing = dns && (!dns.spf.present || !dns.dkim.present || !dns.dmarc.present);

    const issues: string[] = [];
    if (missingCritical.length > 0) issues.push('Headers criticos ausentes');
    if (certExpired) issues.push('Certificado expirado');
    if (dnsMissing) issues.push('Registros DNS de seguridad incompletos');

    return {
      control: 'A.18.1 - Cumplimiento normativo',
      status: issues.length === 0 ? 'compliant' : 'non_compliant',
      relatedHeaders: missingCritical.map((h) => h.header),
      description: issues.length > 0
        ? `Incumplimientos detectados: ${issues.join('; ')}`
        : 'Cumplimiento normativo adecuado en los controles evaluados',
      recommendation: issues.length > 0
        ? 'Corregir las desviaciones detectadas para alcanzar el cumplimiento'
        : 'Mantener el estado de cumplimiento actual',
    };
  }
}

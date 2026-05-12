export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  expiresInDays: number;
  expired: boolean;
  selfSigned: boolean;
  wildcard: boolean;
  fingerprint: string;
  serialNumber: string;
  san: string[];
}

export interface TlsInfo {
  checked: boolean;
  hostname: string;
  port: number;
  error: string | null;
  tlsVersion: string | null;
  certificate: CertificateInfo | null;
  grade: number;
}

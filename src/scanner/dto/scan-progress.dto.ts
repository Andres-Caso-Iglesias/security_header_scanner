export type ScanStage =
  | 'http'
  | 'tls'
  | 'dns'
  | 'security-files'
  | 'sensitive-files'
  | 'sri'
  | 'fingerprint'
  | 'analysis'
  | 'complete';

export type ScanStatus = 'pending' | 'scanning' | 'complete' | 'error';

export interface ScanProgressEvent {
  stage: ScanStage;
  status: ScanStatus;
  message?: string;
  error?: string;
}

export const STAGE_LABELS: Record<ScanStage, string> = {
  'http': 'Headers HTTP',
  'tls': 'TLS / SSL',
  'dns': 'DNS (SPF, DKIM, DMARC)',
  'security-files': 'Archivos de seguridad',
  'sensitive-files': 'Archivos sensibles',
  'sri': 'SRI (Subresource Integrity)',
  'fingerprint': 'Huella digital (fingerprinting)',
  'analysis': 'Analizando resultados',
  'complete': 'Completado',
};

export const STAGE_ORDER: ScanStage[] = [
  'http',
  'tls',
  'dns',
  'security-files',
  'sensitive-files',
  'sri',
  'fingerprint',
  'analysis',
  'complete',
];

import type { ScanResult, HeaderResult, ComplianceSection, TlsInfo, DnsInfo } from '../types';

export const mockHeaders: HeaderResult[] = [
  { header: 'Content-Security-Policy', present: true, value: "default-src 'self'", expected: "default-src 'self'", grade: 0.35, severity: 'critical', weight: 25, finding: 'CSP parcial', recommendation: 'Implementar CSP completo' },
  { header: 'Strict-Transport-Security', present: true, value: 'max-age=31536000', expected: 'max-age=31536000; includeSubDomains', grade: 0.6, severity: 'high', weight: 15, finding: 'HSTS sin includeSubDomains', recommendation: 'Agregar includeSubDomains' },
  { header: 'X-Frame-Options', present: true, value: 'SAMEORIGIN', expected: 'SAMEORIGIN', grade: 1.0, severity: 'low', weight: 5, finding: 'Configurado correctamente', recommendation: '—' },
  { header: 'X-Content-Type-Options', present: true, value: 'nosniff', expected: 'nosniff', grade: 1.0, severity: 'low', weight: 5, finding: 'Configurado', recommendation: '—' },
  { header: 'Referrer-Policy', present: true, value: 'strict-origin-when-cross-origin', expected: 'strict-origin-when-cross-origin', grade: 0.8, severity: 'medium', weight: 5, finding: 'Adecuada', recommendation: 'Considere no-referrer' },
  { header: 'Permissions-Policy', present: false, value: null, expected: '', grade: 0.0, severity: 'medium', weight: 5, finding: 'No implementado', recommendation: 'Implementar' },
  { header: 'Cache-Control', present: true, value: 'no-store', expected: 'no-store', grade: 0.9, severity: 'medium', weight: 5, finding: 'Aceptable', recommendation: '—' },
  { header: 'Access-Control-Allow-Origin', present: true, value: '*', expected: '', grade: 0.2, severity: 'high', weight: 10, finding: 'CORS permisivo', recommendation: 'Restringir' },
  { header: 'Set-Cookie', present: true, value: 'session=abc; Path=/', expected: 'session=abc; Path=/; Secure; HttpOnly', grade: 0.3, severity: 'high', weight: 10, finding: 'Cookie sin Secure', recommendation: 'Agregar Secure' },
  { header: 'Cross-Origin-Resource-Policy', present: false, value: null, expected: '', grade: 0.0, severity: 'medium', weight: 4, finding: 'No implementado', recommendation: 'Implementar CORP' },
  { header: 'Cross-Origin-Opener-Policy', present: false, value: null, expected: '', grade: 0.0, severity: 'medium', weight: 4, finding: 'No implementado', recommendation: 'Implementar COOP' },
  { header: 'Cross-Origin-Embedder-Policy', present: false, value: null, expected: '', grade: 0.0, severity: 'medium', weight: 4, finding: 'No implementado', recommendation: 'Implementar COEP' },
  { header: 'X-Powered-By', present: true, value: 'Express', expected: '', grade: 0.0, severity: 'low', weight: 2, finding: 'Tecnología expuesta', recommendation: 'Eliminar' },
  { header: 'Server', present: true, value: 'nginx/1.24.0', expected: '', grade: 0.0, severity: 'low', weight: 2, finding: 'Versión expuesta', recommendation: 'Ocultar' },
  { header: 'X-XSS-Protection', present: false, value: null, expected: '', grade: 0.5, severity: 'low', weight: 1, finding: 'Obsoleto', recommendation: 'Eliminar' },
];

export const mockCompliance: ComplianceSection[] = [
  {
    framework: 'OWASP Top 10', version: '2021',
    findings: [
      { control: 'A01: Broken Access Control', status: 'non_compliant', relatedHeaders: ['CORS'], description: 'Acceso sin autenticación', recommendation: 'Restringir CORS' },
      { control: 'A02: Cryptographic Failures', status: 'partially_compliant', relatedHeaders: ['HSTS'], description: 'HSTS parcial', recommendation: 'Completar HSTS' },
      { control: 'A05: Security Misconfiguration', status: 'compliant', relatedHeaders: [], description: 'Configuración correcta', recommendation: '—' },
    ],
  },
  {
    framework: 'NIS2', version: '2023',
    findings: [
      { control: 'Art 21(2)(a) — Risk Analysis', status: 'partially_compliant', relatedHeaders: ['CSP'], description: 'Riesgos parcialmente mitigados', recommendation: 'Reforzar CSP' },
    ],
  },
];

export const mockTls: TlsInfo = {
  checked: true, hostname: 'ejemplo.com', port: 443, error: null,
  tlsVersion: 'TLS 1.3',
  certificate: {
    subject: 'CN=ejemplo.com', issuer: 'CN=R3,O=Let\'s Encrypt,C=US',
    validFrom: '2026-01-15', validTo: '2026-04-14', expiresInDays: 18,
    expired: false, selfSigned: false, wildcard: false,
    fingerprint: 'A1:B2:...', serialNumber: '04:AB:...',
    san: ['ejemplo.com', 'www.ejemplo.com'],
  },
  grade: 0.85,
};

export const mockDns: DnsInfo = {
  hostname: 'ejemplo.com', checked: true, error: null,
  spf: { type: 'SPF', value: 'v=spf1 ~all', present: true, grade: 1.0, finding: 'SPF configurado', recommendation: '—' },
  dkim: { type: 'DKIM', value: '', present: false, grade: 0.0, finding: 'DKIM ausente', recommendation: 'Configurar DKIM' },
  dmarc: { type: 'DMARC', value: 'v=DMARC1; p=none;', present: true, grade: 0.4, finding: 'DMARC en monitoreo', recommendation: 'Cambiar a p=quarantine' },
  grade: 0.47,
};

export const mockScanResult: ScanResult = {
  url: 'https://ejemplo.com',
  timestamp: new Date().toISOString(),
  score: 64,
  grade: 'D',
  headers: mockHeaders,
  compliance: mockCompliance,
  recommendations: [
    '[CRITICAL] Implementar CSP completo',
    '[HIGH] Agregar HSTS con includeSubDomains',
    '[HIGH] Configurar Secure en cookies',
    '[MEDIUM] Implementar Permissions-Policy',
    '[LOW] Eliminar X-Powered-By',
  ],
  metadata: { responseTime: 847, statusCode: 200, analyzedAt: new Date().toISOString() },
  tls: mockTls,
  dns: mockDns,
  securityFiles: {
    checked: true,
    securityTxt: { path: '/.well-known/security.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'No encontrado', recommendation: 'Implementar RFC 9116' },
    robotsTxt: { path: '/robots.txt', present: true, statusCode: 200, content: 'User-agent: *\nDisallow: /admin/', grade: 1.0, finding: 'Presente', recommendation: '—' },
    grade: 0.5,
  },
  sri: {
    checked: true, totalResources: 10, secureResources: 3, grade: 0.3,
    finding: 'Solo 3/10 recursos tienen integrity',
    recommendation: 'Agregar atributo integrity',
    insecureResources: [
      { tag: 'script', src: 'https://cdn.example.com/lib.js', hasIntegrity: false },
      { tag: 'link', src: 'https://fonts.googleapis.com/css?family=Roboto', hasIntegrity: false },
    ],
  },
  sensitiveFiles: {
    checked: true, grade: 0.2,
    files: [
      { path: '/.env', statusCode: 200, exposed: true, finding: 'Archivo expuesto', confidence: 'high' },
      { path: '/.git/config', statusCode: 200, exposed: true, finding: 'Git expuesto', confidence: 'medium' },
      { path: '/admin/', statusCode: 403, exposed: false, finding: 'Bloqueado', confidence: 'high' },
    ],
    exposedCount: 2,
  },
  fingerprint: {
    checked: true, grade: 0.6,
    summary: '7 tecnologías detectadas, 2 CVEs.',
    technologies: [
      { name: 'React', version: '18.3.1', category: 'framework', confidence: 'high', evidence: ['data-reactroot'] },
      { name: 'nginx', version: '1.24.0', category: 'server', confidence: 'high', evidence: ['Server header'] },
      { name: 'Cloudflare', version: null, category: 'cdn', confidence: 'high', evidence: ['CF-Ray header'] },
    ],
    cves: [
      { id: 'CVE-2025-1234', description: 'XSS en React', severity: 'high', affectedVersions: '18.3.1' },
    ],
  },
};

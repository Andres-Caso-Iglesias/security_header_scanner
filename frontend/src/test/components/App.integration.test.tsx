import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

let sseShouldFail = false;

vi.stubGlobal('EventSource', class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_url: string) {
    if (sseShouldFail) {
      setTimeout(() => {
        if (this.onerror) this.onerror();
      }, 0);
    } else {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ stage: 'http', status: 'scanning', message: 'Solicitando headers HTTP...' }) } as MessageEvent);
        }
      }, 0);
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify(validResponse) } as MessageEvent);
        }
      }, 0);
    }
  }
  close() {}
});

const validResponse = {
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  score: 71, grade: 'C',
  headers: [
    { header: 'Content-Security-Policy', present: true, value: "default-src 'self'", expected: "default-src 'self'", grade: 0.4, severity: 'critical', weight: 25, finding: 'CSP parcial', recommendation: 'Mejorar CSP' },
    { header: 'Strict-Transport-Security', present: true, value: 'max-age=31536000', expected: 'max-age=31536000; includeSubDomains', grade: 0.6, severity: 'high', weight: 15, finding: 'HSTS sin includeSubDomains', recommendation: 'Agregar includeSubDomains' },
    { header: 'X-Frame-Options', present: true, value: 'SAMEORIGIN', expected: 'SAMEORIGIN', grade: 1.0, severity: 'low', weight: 5, finding: 'OK', recommendation: '—' },
  ],
  compliance: [{
    framework: 'OWASP Top 10', version: '2021',
    findings: [{ control: 'A01: Broken Access Control', status: 'non_compliant', relatedHeaders: ['CORS'], description: 'Acceso sin auth', recommendation: 'Restringir CORS' }],
  }],
  recommendations: ['[CRITICAL] Implementar CSP completo', '[HIGH] HSTS: includeSubDomains'],
  metadata: { responseTime: 847, statusCode: 200, analyzedAt: new Date().toISOString() },
  tls: {
    checked: true, hostname: 'example.com', port: 443, error: null,
    tlsVersion: 'TLS 1.3',
    certificate: {
      subject: 'CN=example.com', issuer: 'CN=CA,C=US',
      validFrom: '2025-01-01', validTo: '2026-01-01',
      expiresInDays: 100, expired: false, selfSigned: false,
      wildcard: false, fingerprint: 'AA:BB:', serialNumber: '01',
      san: ['example.com'],
    }, grade: 1.0,
  },
  dns: {
    hostname: 'example.com', checked: true, error: null,
    spf: { type: 'SPF', value: 'v=spf1 ~all', present: true, grade: 1.0, finding: 'SPF configurado', recommendation: '—' },
    dkim: { type: 'DKIM', value: '', present: false, grade: 0.0, finding: 'DKIM ausente', recommendation: 'Configurar DKIM' },
    dmarc: { type: 'DMARC', value: 'v=DMARC1; p=none;', present: true, grade: 0.4, finding: 'DMARC monitoreo', recommendation: 'Mejorar' },
    grade: 0.47,
  },
  securityFiles: {
    checked: true,
    securityTxt: { path: '/.well-known/security.txt', present: false, statusCode: 404, content: null, grade: 0, finding: 'No encontrado', recommendation: 'Implementar' },
    robotsTxt: { path: '/robots.txt', present: true, statusCode: 200, content: 'User-agent: *\nDisallow: /admin/', grade: 1.0, finding: 'Presente', recommendation: '—' },
    grade: 0.5,
  },
  sri: {
    checked: true, totalResources: 5, secureResources: 2, grade: 0.4,
    finding: '40% con SRI', recommendation: 'Agregar integrity',
    insecureResources: [{ tag: 'script', src: 'https://cdn.example.com/lib.js', hasIntegrity: false }],
  },
  sensitiveFiles: {
    checked: true, grade: 1.0,
    files: [{ path: '/.env', statusCode: 404, exposed: false, finding: 'No encontrado', confidence: 'high' }],
    exposedCount: 0,
  },
  fingerprint: {
    checked: true, grade: 0.6,
    summary: 'Tecnologias detectadas',
    technologies: [{ name: 'nginx', version: '1.24.0', category: 'server', confidence: 'high', evidence: ['Server header'] }],
    cves: [],
  },
};

describe('App Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    sseShouldFail = false;
  });

  it('renderiza el header y el hero inicial', () => {
    render(<App />);
    const headers = screen.getAllByText('Security Header Scanner');
    expect(headers.length).toBe(2); // Header bar + Hero title
    expect(screen.getByText('Escanear')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://ejemplo.com')).toBeInTheDocument();
  });

  it('el boton de escanear aparece deshabilitado sin URL', () => {
    render(<App />);
    const scanButton = screen.getByText('Escanear');
    expect(scanButton.closest('button')).toBeDisabled();
  });

  it('muestra progreso y luego resultados al escanear exitosamente', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validResponse),
    });

    render(<App />);

    const input = screen.getByPlaceholderText('https://ejemplo.com');
    await user.type(input, 'https://example.com');

    const scanButton = screen.getByText('Escanear');
    await user.click(scanButton);

    // Wait for results (loading -> result transition happens after fetch resolves)
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify key elements are present
    expect(screen.getAllByText('Cumplimiento').length).toBeGreaterThan(0);
    expect(screen.getByText('TLS/SSL')).toBeInTheDocument();
    expect(screen.getByText('Descargar JSON')).toBeInTheDocument();
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
  });

  it('muestra error de red cuando el fetch falla', async () => {
    const user = userEvent.setup();
    sseShouldFail = true;

    render(<App />);

    const input = screen.getByPlaceholderText('https://ejemplo.com');
    await user.type(input, 'https://example.com');

    const scanButton = screen.getByText('Escanear');
    await user.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/No se pudo conectar con el servidor/)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('cambia de tab al hacer click', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validResponse),
    });

    render(<App />);

    const input = screen.getByPlaceholderText('https://ejemplo.com');
    await user.type(input, 'https://example.com');
    await user.click(screen.getByText('Escanear'));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click on Cumplimiento tab
    const cumplimientoBtn = screen.getAllByText('Cumplimiento')[0];
    await user.click(cumplimientoBtn);
    expect(screen.getByText('OWASP Top 10')).toBeInTheDocument();

    // Click on TLS/SSL tab and check TLS 1.3 appears in the section (not in metadata)
    await user.click(screen.getByText('TLS/SSL'));
    const tls13Elements = screen.getAllByText('TLS 1.3');
    expect(tls13Elements.length).toBeGreaterThanOrEqual(1);
  });
});

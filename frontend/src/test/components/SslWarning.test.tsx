import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SslWarning } from '../../components/results/SslWarning';
import type { TlsInfo } from '../../types';

const validTls: TlsInfo = {
  checked: true, hostname: 'ejemplo.com', port: 443, error: null,
  tlsVersion: 'TLS 1.3',
  certificate: {
    subject: 'CN=ejemplo.com', issuer: 'CN=CA',
    validFrom: '2026-01-01', validTo: '2027-01-01',
    expiresInDays: 365, expired: false, selfSigned: false,
    wildcard: false, fingerprint: 'AA:BB:', serialNumber: '01',
    san: ['ejemplo.com'],
  },
  grade: 1.0,
};

const expiredTls: TlsInfo = {
  ...validTls,
  certificate: {
    ...validTls.certificate!,
    validTo: '2025-01-01',
    expiresInDays: -100, expired: true,
  },
};

const expiringTls: TlsInfo = {
  ...validTls,
  certificate: {
    ...validTls.certificate!,
    validTo: '2026-06-01',
    expiresInDays: 15, expired: false,
  },
};

const noCertTls: TlsInfo = {
  ...validTls,
  certificate: null,
  error: 'Connection failed',
};

describe('SslWarning', () => {
  it('no renderiza nada cuando el certificado es válido', () => {
    const { container } = render(<SslWarning tls={validTls} />);
    expect(container.innerHTML).toBe('');
  });

  it('no renderiza nada cuando no hay certificado', () => {
    const { container } = render(<SslWarning tls={noCertTls} />);
    expect(container.innerHTML).toBe('');
  });

  it('renderiza alerta cuando el certificado está expirado', () => {
    render(<SslWarning tls={expiredTls} />);
    expect(screen.getByText('Certificado TLS EXPIRADO')).toBeInTheDocument();
    expect(screen.getByText(/Debe renovarse inmediatamente/)).toBeInTheDocument();
  });

  it('renderiza alerta cuando el certificado expira pronto', () => {
    render(<SslWarning tls={expiringTls} />);
    expect(screen.getByText(/Certificado próximo a expirar/)).toBeInTheDocument();
    expect(screen.getByText(/15 días/)).toBeInTheDocument();
    expect(screen.getByText(/Renueve antes/)).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScanProgress } from '../../components/ScanProgress';
import type { StageInfo } from '../../components/ScanProgress';

describe('ScanProgress', () => {
  const allPending: StageInfo[] = [
    { stage: 'http', status: 'pending' },
    { stage: 'tls', status: 'pending' },
    { stage: 'dns', status: 'pending' },
    { stage: 'security-files', status: 'pending' },
    { stage: 'sensitive-files', status: 'pending' },
    { stage: 'sri', status: 'pending' },
    { stage: 'fingerprint', status: 'pending' },
    { stage: 'analysis', status: 'pending' },
    { stage: 'complete', status: 'pending' },
  ];

  const partiallyComplete: StageInfo[] = [
    { stage: 'http', status: 'complete' },
    { stage: 'tls', status: 'complete' },
    { stage: 'dns', status: 'complete' },
    { stage: 'security-files', status: 'scanning' },
    { stage: 'sensitive-files', status: 'pending' },
    { stage: 'sri', status: 'pending' },
    { stage: 'fingerprint', status: 'pending' },
    { stage: 'analysis', status: 'pending' },
    { stage: 'complete', status: 'pending' },
  ];

  const allComplete: StageInfo[] = [
    { stage: 'http', status: 'complete' },
    { stage: 'tls', status: 'complete' },
    { stage: 'dns', status: 'complete' },
    { stage: 'security-files', status: 'complete' },
    { stage: 'sensitive-files', status: 'complete' },
    { stage: 'sri', status: 'complete' },
    { stage: 'fingerprint', status: 'complete' },
    { stage: 'analysis', status: 'complete' },
    { stage: 'complete', status: 'complete' },
  ];

  it('renderiza todas las etapas como pendientes', () => {
    render(<ScanProgress stages={allPending} />);

    expect(screen.getByText('Headers HTTP')).toBeInTheDocument();
    expect(screen.getByText('TLS / SSL')).toBeInTheDocument();
    expect(screen.getByText('DNS (SPF, DKIM, DMARC)')).toBeInTheDocument();
    expect(screen.getByText('Archivos de seguridad')).toBeInTheDocument();
    expect(screen.getByText('Archivos sensibles')).toBeInTheDocument();
    expect(screen.getByText('SRI (Subresource Integrity)')).toBeInTheDocument();
    expect(screen.getByText('Huella digital (fingerprinting)')).toBeInTheDocument();
    expect(screen.getByText('Analizando resultados')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('muestra 0% cuando todo esta pendiente', () => {
    render(<ScanProgress stages={allPending} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('muestra porcentaje correcto segun etapas completadas', () => {
    // 3 de 9 completadas = 33%
    render(<ScanProgress stages={partiallyComplete} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('muestra 100% cuando todo esta completado', () => {
    render(<ScanProgress stages={allComplete} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('muestra el mensaje contextual', () => {
    render(<ScanProgress stages={partiallyComplete} message="Escaneando archivos sensibles..." />);
    expect(screen.getByText('Escaneando archivos sensibles...')).toBeInTheDocument();
  });

  it('las etapas completadas tienen checkmark SVG', () => {
    const { container } = render(<ScanProgress stages={allComplete} />);
    const checkmarks = container.querySelectorAll('polyline[points="20 6 9 17 4 12"]');
    expect(checkmarks.length).toBe(9);
  });

  it('las etapas en scanning tienen spinner', () => {
    const { container } = render(<ScanProgress stages={partiallyComplete} />);
    const spinners = container.querySelectorAll('path[d="M21 12a9 9 0 1 1-6.219-8.56"]');
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it('no renderiza el mensaje si no se proporciona', () => {
    render(<ScanProgress stages={allPending} />);
    expect(screen.queryByText(/Escaneando/)).not.toBeInTheDocument();
  });
});

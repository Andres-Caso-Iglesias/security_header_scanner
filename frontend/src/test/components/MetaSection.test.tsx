import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetaSection } from '../../components/MetaSection';
import { mockScanResult } from '../mock-data';

describe('MetaSection', () => {
  it('renderiza la URL escaneada', () => {
    render(<MetaSection result={mockScanResult} />);
    expect(screen.getByText('https://ejemplo.com')).toBeInTheDocument();
  });

  it('renderiza las métricas', () => {
    render(<MetaSection result={mockScanResult} />);
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('847ms')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('TLS 1.3')).toBeInTheDocument();
  });

  it('renderiza los botones de descarga', () => {
    render(<MetaSection result={mockScanResult} />);
    expect(screen.getByText('Descargar JSON')).toBeInTheDocument();
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
  });

  it('renderiza el ScoreCircle con el score correcto', () => {
    render(<MetaSection result={mockScanResult} />);
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('64/100')).toBeInTheDocument();
  });

  it('renderiza el resumen DNS correctamente', () => {
    render(<MetaSection result={mockScanResult} />);
    expect(screen.getByText('2/3 OK')).toBeInTheDocument();
  });
});

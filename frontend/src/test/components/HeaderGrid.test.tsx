import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderGrid } from '../../components/HeaderGrid';
import { mockHeaders } from '../mock-data';

describe('HeaderGrid', () => {
  it('renderiza todos los headers por defecto', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    expect(screen.getByText('Headers de Seguridad')).toBeInTheDocument();

    mockHeaders.forEach(h => {
      expect(screen.getByText(h.header)).toBeInTheDocument();
    });
  });

  it('muestra el contador correcto', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    expect(screen.getByText(`15 de ${mockHeaders.length}`)).toBeInTheDocument();
  });

  it('filtra por severidad critical', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'critical' } });

    expect(screen.getByText('Content-Security-Policy')).toBeInTheDocument();
    const criticalHeaders = mockHeaders.filter(h => h.severity === 'critical');
    expect(screen.getByText(`${criticalHeaders.length} de ${mockHeaders.length}`)).toBeInTheDocument();
  });

  it('filtra por severidad high', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'high' } });

    const highHeaders = mockHeaders.filter(h => h.severity === 'high');
    const otherHeaders = mockHeaders.filter(h => h.severity !== 'high');

    highHeaders.forEach(h => {
      expect(screen.getByText(h.header)).toBeInTheDocument();
    });

    expect(screen.getByText(`${highHeaders.length} de ${mockHeaders.length}`)).toBeInTheDocument();
  });

  it('filtra por severidad low', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'low' } });

    expect(screen.queryByText('Content-Security-Policy')).not.toBeInTheDocument();
    const lowHeaders = mockHeaders.filter(h => h.severity === 'low');
    expect(screen.getByText(`${lowHeaders.length} de ${mockHeaders.length}`)).toBeInTheDocument();
  });

  it('renderiza cada tarjeta con su finding', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    expect(screen.getByText('CSP parcial')).toBeInTheDocument();
    expect(screen.getByText('CORS permisivo')).toBeInTheDocument();
  });

  it('renderiza recomendacion cuando no es "—"', () => {
    render(<HeaderGrid headers={mockHeaders} />);
    expect(screen.getByText('Implementar CSP completo')).toBeInTheDocument();
  });
});

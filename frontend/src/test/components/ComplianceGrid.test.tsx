import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplianceGrid } from '../../components/results/ComplianceGrid';
import { mockCompliance } from '../mock-data';

describe('ComplianceGrid', () => {
  it('renderiza el disclaimer', () => {
    render(<ComplianceGrid compliance={mockCompliance} />);
    expect(screen.getByText(/Mapeo automático/)).toBeInTheDocument();
    expect(screen.getByText(/no reemplaza una auditoría formal/)).toBeInTheDocument();
  });

  it('renderiza los frameworks', () => {
    render(<ComplianceGrid compliance={mockCompliance} />);
    expect(screen.getByText('OWASP Top 10')).toBeInTheDocument();
    expect(screen.getByText('NIS2')).toBeInTheDocument();
  });

  it('renderiza las versiones', () => {
    render(<ComplianceGrid compliance={mockCompliance} />);
    expect(screen.getByText('versión 2021')).toBeInTheDocument();
    expect(screen.getByText('versión 2023')).toBeInTheDocument();
  });

  it('renderiza los controles y su estado', () => {
    render(<ComplianceGrid compliance={mockCompliance} />);
    expect(screen.getByText('A01: Broken Access Control')).toBeInTheDocument();
    expect(screen.getByText('non compliant')).toBeInTheDocument();
    expect(screen.getByText('compliant')).toBeInTheDocument();
  });

  it('renderiza los porcentajes de cumplimiento', () => {
    render(<ComplianceGrid compliance={mockCompliance} />);
    // OWASP: 1 de 3 compliant = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
    // NIS2: 0 de 1 compliant = 0%
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

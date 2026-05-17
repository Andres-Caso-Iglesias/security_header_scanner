import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';

function GoodComponent() {
  return <div>Componente funcionando</div>;
}

function BrokenComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error: component crashed');
  }
  return <div>Componente funcionando</div>;
}

const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renderiza los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary title="Test">
        <div>Contenido normal</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('captura el error y muestra mensaje con titulo especifico', () => {
    render(
      <ErrorBoundary title="Sección Prueba">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Error en Sección Prueba')).toBeInTheDocument();
    expect(screen.getByText(/Test error: component crashed/)).toBeInTheDocument();
  });

  it('captura error y muestra titulo generico si no se especifica', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Error en sección')).toBeInTheDocument();
  });

  it('boton reintentar resetea el estado', () => {
    render(
      <ErrorBoundary title="Test">
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
  });

  it('despues de reintentar, el contenido se restaura', () => {
    // Render without error, trigger error, then fix and retry
    const { rerender } = render(
      <ErrorBoundary title="Test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Error en Test')).toBeInTheDocument();

    // First change to a good component, then click retry
    rerender(
      <ErrorBoundary title="Test">
        <GoodComponent />
      </ErrorBoundary>
    );

    // Click reintentar to reset error state
    fireEvent.click(screen.getByText('Reintentar'));

    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
    expect(screen.queryByText('Error en Test')).not.toBeInTheDocument();
  });
});

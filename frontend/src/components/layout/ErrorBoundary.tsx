import { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.title ? ` - ${this.props.title}` : ''}]:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <div className="w-1 h-10 rounded-sm bg-[var(--color-accent-red)] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-accent-red)]">
                Error en {this.props.title || 'sección'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'Ocurrió un error inesperado al renderizar esta sección.'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-elevated)] text-slate-300 border border-slate-700/30 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

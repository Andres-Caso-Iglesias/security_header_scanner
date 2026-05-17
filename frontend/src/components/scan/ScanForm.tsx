import { cn } from '../../lib/cn';

interface ScanFormProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onScan: () => void;
}

export function ScanForm({ url, loading, onUrlChange, onScan }: ScanFormProps) {
  return (
    <section className="text-center py-12 px-4">
      <h1 className="text-[2.2rem] font-extrabold tracking-tight mb-2 text-white"
        style={{ textShadow: '0 0 40px rgba(96,165,250,0.15)' }}>
        Auditoría de Seguridad Web
      </h1>
      <p className="text-slate-400 text-base mb-8 max-w-[600px] mx-auto">
        Análisis pasivo de headers HTTP, TLS, DNS y huella digital. Sin intrusión, sin payloads.
      </p>

      <div className="flex gap-3 max-w-[640px] mx-auto">
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onScan()}
          placeholder="https://ejemplo.com"
          disabled={loading}
          className={cn(
            "flex-1 px-5 py-3.5 rounded-xl border text-white text-base outline-none transition-colors",
            "border-slate-700/40 bg-[var(--color-bg-surface)]",
            "focus:border-[var(--color-accent-blue)]",
            "placeholder:text-slate-600",
            "disabled:opacity-50"
          )}
        />
        <button
          onClick={onScan}
          disabled={loading || !url.trim()}
          className={cn(
            "px-8 py-3.5 rounded-xl border-none font-semibold text-base cursor-pointer",
            "flex items-center gap-2 whitespace-nowrap transition-all",
            "bg-[var(--color-accent-blue)] text-white",
            "hover:brightness-110",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && "animate-scan-pulse"
          )}
        >
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
          {loading ? 'Escaneando...' : 'Escanear'}
        </button>
      </div>

      <div className="flex gap-4 justify-center flex-wrap mt-4">
        <span className="text-[0.8rem] text-slate-500">15+ headers de seguridad</span>
        <span className="text-[0.8rem] text-slate-500">TLS/SSL + DNS</span>
        <span className="text-[0.8rem] text-slate-500">4 frameworks de compliance</span>
      </div>
    </section>
  );
}

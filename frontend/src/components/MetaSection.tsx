import { ScoreCircle } from './ScoreCircle';
import type { ScanResult } from '../types';

interface MetaSectionProps {
  result: ScanResult;
}

export function MetaSection({ result }: MetaSectionProps) {
  const dnsOk = [result.dns.spf, result.dns.dkim, result.dns.dmarc].filter(r => r.present).length;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-8 items-start mb-6 animate-fade-in-up">
      <ScoreCircle score={result.score} grade={result.grade} />

      <div className="min-w-0">
        {/* URL */}
        <div className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-4">
          <div className="text-[0.75rem] text-slate-500 uppercase tracking-wider font-medium">URL</div>
          <div className="text-sm text-[var(--color-accent-cyan)] truncate mt-1">
            {result.url}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 mt-3">
          <MetaCard label="HTTP Status" value={String(result.metadata.statusCode)} large />
          <MetaCard label="Tiempo Respuesta" value={`${result.metadata.responseTime}ms`} large />
          <MetaCard label="Headers" value={String(result.headers.length)} large />
          <MetaCard label="TLS" value={result.tls.tlsVersion || (result.tls.error ? 'Error' : 'N/A')} />
          <MetaCard label="DNS" value={`${dnsOk}/3 OK`} />
        </div>

        {/* Download buttons */}
        <div className="flex gap-2 mt-4">
          <DownloadButton
            onClick={() => downloadReport('json')}
            icon={
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            }
            label="Descargar JSON"
          />
          <DownloadButton
            onClick={() => downloadReport('pdf')}
            icon={
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            }
            label="Descargar PDF"
          />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-4">
      <div className="text-[0.75rem] text-slate-500 uppercase tracking-wider font-medium">{label}</div>
      <div className={large ? "text-[1.5rem] font-bold leading-none mt-1 text-white" : "text-base font-semibold mt-1 text-white"}>
        {value}
      </div>
    </div>
  );
}

function DownloadButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] px-[18px] py-2 inline-flex items-center gap-[6px] text-[0.8rem] font-medium text-slate-400 cursor-pointer hover:border-slate-700/30 hover:bg-[var(--color-bg-elevated)] transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}

async function downloadReport(format: 'json' | 'pdf') {
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const url = urlInput?.value;
  if (!url) return;
  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), format }),
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)}-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (e) {
    console.error('Export error:', e);
  }
}

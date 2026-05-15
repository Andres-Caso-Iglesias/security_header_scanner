import type { TlsInfo } from '../types';

interface TlsSectionProps {
  tls: TlsInfo;
}

export function TlsSection({ tls }: TlsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Conexión</h3>
        {tls.error ? (
          <div className="p-3 rounded-lg bg-red-500/10 text-[var(--color-accent-red)] text-sm">{tls.error}</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <InfoRow label="Versión TLS" value={tls.tlsVersion || 'N/A'} />
            <InfoRow label="Host" value={`${tls.hostname}:${tls.port}`} />
            <InfoRow label="Grade" value={
              <span className="font-semibold" style={{ color: tls.grade >= 0.8 ? '#4ade80' : tls.grade >= 0.5 ? '#facc15' : '#f87171' }}>
                {Math.round(tls.grade * 100)}%
              </span>
            } />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Certificado</h3>
        {tls.certificate ? (
          <div className="flex flex-col gap-2.5">
            <InfoRow label="Sujeto" value={tls.certificate.subject} mono />
            <InfoRow label="Emisor" value={tls.certificate.issuer} mono />
            <InfoRow label="Válido desde" value={tls.certificate.validFrom} />
            <InfoRow label="Válido hasta" value={
              tls.certificate.expired
                ? <span className="text-[var(--color-accent-red)]">{tls.certificate.validTo} (EXPIRADO)</span>
                : tls.certificate.expiresInDays < 30
                  ? <>{tls.certificate.validTo} <span className="text-[var(--color-accent-yellow)]">({tls.certificate.expiresInDays} días)</span></>
                  : tls.certificate.validTo
            } />
            <InfoRow label="Self-Signed" value={tls.certificate.selfSigned ? 'Sí (self-signed)' : 'No'} />
            <InfoRow label="Wildcard" value={tls.certificate.wildcard ? 'Sí' : 'No'} />
            {tls.certificate.san.length > 0 && (
              <InfoRow label="SAN" value={
                tls.certificate.san.slice(0, 4).join(', ') +
                (tls.certificate.san.length > 4 ? `... (+${tls.certificate.san.length - 4})` : '')
              } mono />
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-500">Sin información de certificado</span>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

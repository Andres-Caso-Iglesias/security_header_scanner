import type { TechFingerprintInfo } from '../../types';

interface FingerprintSectionProps {
  fingerprint: TechFingerprintInfo;
}

export function FingerprintSection({ fingerprint: fp }: FingerprintSectionProps) {
  const confidenceColor = (c: string) =>
    c === 'high' ? '#4ade80' : c === 'medium' ? '#facc15' : '#94a3b8';

  const confidenceBg = (c: string) =>
    c === 'high' ? 'rgba(74,222,128,0.12)' : c === 'medium' ? 'rgba(250,204,21,0.12)' : 'rgba(148,163,184,0.12)';

  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">{fp.summary}</p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 mb-6">
        {fp.technologies.map((t, i) => (
          <div key={i} className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-3.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold text-sm text-white">{t.name}</span>
                {t.version && <span className="text-xs text-slate-500 ml-1.5">{t.version}</span>}
              </div>
              <span
                className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: confidenceBg(t.confidence), color: confidenceColor(t.confidence) }}
              >
                {t.confidence}
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">{t.category}</span>
            {t.evidence.map((e, j) => (
              <div key={j} className="text-xs text-slate-400 mt-0.5">▸ {e}</div>
            ))}
          </div>
        ))}
      </div>

      {fp.cves.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            CVEs Detectados
            <span className="text-xs bg-[var(--color-accent-red)] text-white px-2.5 py-0.5 rounded-full">
              {fp.cves.length}
            </span>
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
            {fp.cves.map((c, i) => {
              const cColor = c.severity === 'critical' ? '#f87171' : c.severity === 'high' ? '#fb923c' : c.severity === 'medium' ? '#facc15' : '#4ade80';
              return (
                <div key={i} className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-3.5" style={{ borderLeftColor: cColor, borderLeftWidth: 3 }}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold font-mono text-sm text-white">{c.id}</span>
                    <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full" style={{ background: `${cColor}20`, color: cColor }}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 my-2">{c.description}</p>
                  <span className="text-xs text-slate-500">Afecta: {c.affectedVersions}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

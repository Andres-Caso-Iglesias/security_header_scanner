import type { SensitiveFilesInfo } from '../types';

interface SensitiveSectionProps {
  sensitive: SensitiveFilesInfo;
}

export function SensitiveSection({ sensitive: sf }: SensitiveSectionProps) {
  if (sf.exposedCount === 0) {
    return (
      <p className="text-[var(--color-accent-green)]">No se detectaron archivos sensibles expuestos.</p>
    );
  }

  return (
    <div>
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/15 mb-4">
        <strong className="text-[var(--color-accent-red)]">{sf.exposedCount} archivo(s) sensible(s) expuesto(s)</strong>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2">
        {sf.files.filter(f => f.exposed).map((f, i) => (
          <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <div className="font-mono text-sm text-[var(--color-accent-red)]">{f.path}</div>
            <div className="text-xs text-slate-400 mt-1">{f.finding}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

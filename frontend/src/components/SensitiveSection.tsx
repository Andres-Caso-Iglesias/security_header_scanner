import { cn } from '../lib/cn';
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
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-sm text-[var(--color-accent-red)]">{f.path}</div>
              <span className={cn(
                "text-[0.6rem] font-semibold uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap",
                f.confidence === 'high' && "bg-red-500/15 text-[var(--color-accent-red)]",
                f.confidence === 'medium' && "bg-yellow-500/15 text-[var(--color-accent-yellow)]",
                f.confidence === 'low' && "bg-orange-500/15 text-[var(--color-accent-orange)]"
              )}>
                {f.confidence}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{f.finding}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

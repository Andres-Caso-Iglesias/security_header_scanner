import type { SecurityFileInfo } from '../../types';

interface SecurityFilesSectionProps {
  securityFiles: SecurityFileInfo;
}

export function SecurityFilesSection({ securityFiles: sf }: SecurityFilesSectionProps) {
  const files = [sf.securityTxt, sf.robotsTxt];

  return (
    <div className="mt-8 animate-fade-in-up">
      <h2 className="text-lg font-semibold mb-3 text-white">Archivos de Seguridad</h2>
      <div className="grid grid-cols-2 gap-4">
        {files.map(f => (
          <div
            key={f.path}
            className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-4"
            style={{ opacity: f.present ? 1 : 0.7 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold font-mono text-sm text-white">{f.path}</span>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: f.present ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                  color: f.present ? '#4ade80' : '#f87171',
                }}
              >
                {f.present ? 'Encontrado' : 'No encontrado'}
              </span>
            </div>
            {f.content && (
              <pre className="text-xs text-slate-500 bg-black/20 p-2.5 rounded-md overflow-x-auto mb-2">{f.content}</pre>
            )}
            <p className="text-sm text-slate-400">{f.finding}</p>
            {!f.present && (
              <p className="text-xs mt-1 text-[var(--color-accent-orange)]">{f.recommendation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

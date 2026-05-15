import { cn } from '../lib/cn';

export type ScanStage =
  | 'http' | 'tls' | 'dns' | 'security-files'
  | 'sensitive-files' | 'sri' | 'fingerprint' | 'analysis' | 'complete';

export type ScanStageStatus = 'pending' | 'scanning' | 'complete' | 'error';

interface StageInfo {
  stage: ScanStage;
  status: ScanStageStatus;
}

const STAGE_CONFIG: Record<ScanStage, { label: string }> = {
  'http': { label: 'Headers HTTP' },
  'tls': { label: 'TLS / SSL' },
  'dns': { label: 'DNS (SPF, DKIM, DMARC)' },
  'security-files': { label: 'Archivos de seguridad' },
  'sensitive-files': { label: 'Archivos sensibles' },
  'sri': { label: 'SRI (Subresource Integrity)' },
  'fingerprint': { label: 'Huella digital (fingerprinting)' },
  'analysis': { label: 'Analizando resultados' },
  'complete': { label: 'Completado' },
};

const STAGE_ORDER: ScanStage[] = [
  'http', 'tls', 'dns', 'security-files',
  'sensitive-files', 'sri', 'fingerprint', 'analysis', 'complete',
];

interface ScanProgressProps {
  stages: StageInfo[];
  message?: string;
}

export function ScanProgress({ stages, message }: ScanProgressProps) {
  const completedCount = stages.filter(s => s.status === 'complete').length;
  const total = STAGE_ORDER.length;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="py-8 max-w-[500px] mx-auto animate-fade-in-up">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--color-accent-blue), var(--color-accent-purple))',
            }}
          />
        </div>
        <span className="text-xs font-medium text-slate-400 min-w-[3ch] text-right">{pct}%</span>
      </div>

      {/* Status message */}
      {message && (
        <p className="text-sm text-slate-400 text-center mb-6">{message}</p>
      )}

      {/* Stage list */}
      <div className="flex flex-col gap-2">
        {STAGE_ORDER.map((stage) => {
          const info = stages.find(s => s.stage === stage);
          const status: ScanStageStatus = info?.status || 'pending';
          const config = STAGE_CONFIG[stage];

          return (
            <div key={stage} className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
              status === 'complete' && "bg-green-500/5",
              status === 'scanning' && "bg-blue-500/5 border border-blue-500/10",
              status === 'pending' && "opacity-40",
            )}>
              {/* Status indicator */}
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {status === 'complete' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : status === 'scanning' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-sm flex-1",
                status === 'complete' && "text-slate-300",
                status === 'scanning' && "text-white font-medium",
                status === 'pending' && "text-slate-600",
              )}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { StageInfo };

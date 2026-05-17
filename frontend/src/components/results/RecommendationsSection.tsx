import { useState } from 'react';

interface RecommendationsSectionProps {
  recommendations: string[];
}

const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH: '#fb923c',
  MEDIUM: '#facc15',
  LOW: '#94a3b8',
};

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {SEV_ORDER.map(s => {
        const items = recommendations.filter(r => r.startsWith(`[${s}]`));
        if (!items.length) return null;
        return (
          <div key={s}>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: SEV_COLORS[s] }}
            >
              {s} <span className="font-normal text-slate-500">({items.length})</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {items.map((r, i) => (
                <RecItem key={i} text={r.replace(`[${s}] `, '')} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecItem({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] px-3 py-2.5 text-xs text-slate-400 cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
    >
      {expanded ? text : `${text.substring(0, 60)}...`}
    </div>
  );
}

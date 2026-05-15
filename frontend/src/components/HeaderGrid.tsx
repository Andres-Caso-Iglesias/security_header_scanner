import { useState, useMemo } from 'react';
import type { HeaderResult, HeaderSeverity } from '../types';
import { SEVERITY } from '../types';

interface HeaderGridProps {
  headers: HeaderResult[];
}

export function HeaderGrid({ headers }: HeaderGridProps) {
  const [filter, setFilter] = useState<HeaderSeverity | 'all'>('all');

  const filtered = useMemo(
    () => filter === 'all' ? headers : headers.filter(h => h.severity === filter),
    [headers, filter]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Headers de Seguridad</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtrar:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as HeaderSeverity | 'all')}
            className="px-3 py-1.5 rounded-md border border-slate-700/30 bg-[var(--color-bg-surface)] text-sm text-slate-400 outline-none"
          >
            <option value="all">Todas</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="text-xs text-slate-500">{filtered.length} de {headers.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filtered.map(h => (
          <HeaderCard key={h.header} header={h} />
        ))}
      </div>
    </div>
  );
}

function HeaderCard({ header: h }: { header: HeaderResult }) {
  const sev = SEVERITY[h.severity];
  const pct = Math.round(h.grade * 100);
  const dotColor = h.grade === 1 ? '#4ade80' : h.grade >= 0.5 ? '#facc15' : '#f87171';

  return (
    <div
      className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-4 transition-all hover:border-slate-700/30 hover:bg-[var(--color-bg-elevated)]"
      style={{ borderLeftColor: sev.color, borderLeftWidth: 3 }}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-semibold text-sm font-mono text-white">{h.header}</span>
        <div className="flex items-center gap-[6px] flex-shrink-0">
          <span
            className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: sev.bg, color: sev.color }}
          >
            {h.severity}
          </span>
          <span className="w-[10px] h-[10px] rounded-full inline-block flex-shrink-0" style={{ background: dotColor }} />
        </div>
      </div>

      {/* Grade bar */}
      <div className="my-2.5">
        <div className="h-1 rounded-sm bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-1000"
            style={{ width: `${pct}%`, background: sev.color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">{pct}%</span>
          <span className="text-xs text-slate-500">peso: {h.weight}</span>
        </div>
      </div>

      {h.value && (
        <div className="text-xs text-slate-500 font-mono mb-1.5 truncate">{h.value}</div>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">{h.finding}</p>
      {h.recommendation !== '—' && (
        <p className="text-xs mt-1" style={{ color: sev.color }}>{h.recommendation}</p>
      )}
    </div>
  );
}

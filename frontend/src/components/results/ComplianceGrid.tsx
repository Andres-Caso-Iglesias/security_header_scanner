import type { ComplianceSection } from '../../types';
import { COMPLIANCE_COLORS } from '../../types';

interface ComplianceGridProps {
  compliance: ComplianceSection[];
}

export function ComplianceGrid({ compliance }: ComplianceGridProps) {
  return (
    <div>
      {/* Disclaimer */}
      <div className="mb-4 p-3 rounded-lg bg-yellow-500/8 border border-yellow-500/15 text-xs text-slate-400 leading-relaxed">
        <strong className="text-[var(--color-accent-yellow)]">Mapeo automático — no reemplaza una auditoría formal.</strong>{' '}
        El cumplimiento se evalúa exclusivamente en base a los headers HTTP. Los frameworks normativos incluyen requisitos organizativos, de procesos y técnicos que no pueden verificarse solo con headers.
      </div>

      <div className="grid grid-cols-4 gap-4">
      {compliance.map(comp => {
        const total = comp.findings.length;
        const ok = comp.findings.filter(f => f.status === 'compliant').length;
        const partial = comp.findings.filter(f => f.status === 'partially_compliant').length;
        const non = comp.findings.filter(f => f.status === 'non_compliant').length;
        const pct = Math.round((ok / total) * 100);
        const overallColor = pct === 100 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171';

        return (
          <div key={comp.framework} className="rounded-xl border border-slate-700/20 bg-[var(--color-bg-elevated)] p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-bold text-base text-white">{comp.framework}</div>
                <div className="text-xs text-slate-500">versión {comp.version}</div>
              </div>
              <div className="text-right">
                <div className="text-[1.5rem] font-extrabold" style={{ color: overallColor }}>{pct}%</div>
                <div className="flex gap-1.5 justify-end mt-1">
                  {ok > 0 && <StatDot count={ok} color="#4ade80" />}
                  {partial > 0 && <StatDot count={partial} color="#facc15" />}
                  {non > 0 && <StatDot count={non} color="#f87171" />}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {comp.findings.map((f, i) => {
                const fColor = COMPLIANCE_COLORS[f.status] || '#64748b';
                return (
                  <div key={i} className="p-3 rounded-lg bg-white/5" style={{ borderLeftColor: fColor, borderLeftWidth: 3 }}>
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{f.control}</span>
                      <span
                        className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${fColor}20`, color: fColor }}
                      >
                        {f.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                    {f.recommendation !== '—' && (
                      <p className="text-xs mt-1" style={{ color: fColor }}>{f.recommendation}</p>
                    )}
                    {f.relatedHeaders.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">Headers relacionados: {f.relatedHeaders.join(', ')}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

function StatDot({ count, color }: { count: number; color: string }) {
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {count}
    </span>
  );
}

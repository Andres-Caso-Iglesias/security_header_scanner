import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
import type { SriInfo } from '../../types';

interface SriSectionProps {
  sri: SriInfo;
}

export function SriSection({ sri }: SriSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Con SRI', 'Sin SRI'],
        datasets: [{
          data: [sri.secureResources, sri.totalResources - sri.secureResources],
          backgroundColor: ['#4ade80', 'rgba(248,113,113,0.3)'],
          borderWidth: 0,
        }],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
      },
    });

    return () => chart.destroy();
  }, [sri.secureResources, sri.totalResources]);

  return (
    <div className="rounded-xl border border-slate-700/10 bg-[var(--color-bg-surface)] p-6">
      <div className="flex gap-8 items-center flex-wrap">
        <div className="text-center">
          <canvas ref={canvasRef} width="140" height="140" className="max-w-[140px]" />
          <div className="mt-2 text-sm text-slate-400">Recursos con SRI</div>
        </div>
        <div>
          <div className="text-base font-medium text-white mb-2">{sri.finding}</div>
          <div className="text-sm text-slate-400">{sri.recommendation}</div>
        </div>
      </div>

      {sri.insecureResources.length > 0 && (
        <div className="mt-5">
          {sri.insecureResources.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
              <span className="text-xs font-mono text-[var(--color-accent-red)] bg-red-500/10 px-2 py-0.5 rounded flex-shrink-0">
                {r.tag}
              </span>
              <span className="text-xs text-slate-500 truncate">{r.src}</span>
              <span className="ml-auto text-xs text-[var(--color-accent-red)]">sin integrity</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

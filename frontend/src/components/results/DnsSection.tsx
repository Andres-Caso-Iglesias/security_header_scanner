import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
import type { DnsInfo } from '../../types';

interface DnsSectionProps {
  dns: DnsInfo;
}

export function DnsSection({ dns }: DnsSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const records = [dns.spf, dns.dkim, dns.dmarc];
  const ok = records.filter(r => r.present).length;

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Configurados', 'Ausentes'],
        datasets: [{
          data: [ok, 3 - ok],
          backgroundColor: ['#4ade80', 'rgba(255,255,255,0.08)'],
          borderWidth: 0,
        }],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
      },
    });

    return () => chart.destroy();
  }, [ok]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {records.map(r => {
          const good = r.grade >= 1;
          const warn = r.grade >= 0.4;
          const color = good ? '#4ade80' : warn ? '#facc15' : '#f87171';
          const bg = good ? 'rgba(74,222,128,0.08)' : warn ? 'rgba(250,204,21,0.08)' : 'rgba(248,113,113,0.08)';
          return (
            <div key={r.type} className="rounded-xl border-t-[3px] p-4" style={{ borderTopColor: color, background: bg }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-white">{r.type}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                  {r.present ? 'Configurado' : 'Ausente'}
                </span>
              </div>
              {r.value && (
                <div className="text-xs font-mono text-slate-500 bg-black/20 p-2 rounded-md mb-2 break-all">
                  {r.value}
                </div>
              )}
              <p className="text-sm text-slate-400">{r.finding}</p>
              {r.grade < 1 && (
                <p className="text-xs mt-1" style={{ color }}>{r.recommendation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 items-center mt-4">
        <canvas ref={canvasRef} width="160" height="160" className="max-w-[140px]" />
        <div className="text-sm text-slate-400">
          {ok}/{records.length} registros DNS configurados. Grade general: {Math.round(dns.grade * 100)}%
        </div>
      </div>
    </div>
  );
}

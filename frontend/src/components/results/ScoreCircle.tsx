import { useState } from 'react';
import { GRADE_COLORS } from '../../types';

interface ScoreCircleProps {
  score: number;
  grade: string;
}

export function ScoreCircle({ score, grade }: ScoreCircleProps) {
  const color = GRADE_COLORS[grade] || '#64748b';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-center min-w-[180px] px-6 py-5">
      <svg width="160" height="160" viewBox="0 0 120 120" className="block mx-auto">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="6" strokeLinecap="round"
          transform="rotate(-90 60 60)"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.3s' }}
        />
        <text x="60" y="50" textAnchor="middle" dominantBaseline="central"
          fill={color}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '40px', fontWeight: 800 }}>
          {grade}
        </text>
        <text x="60" y="76" textAnchor="middle" dominantBaseline="central"
          fill={color}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px' }}>
          {score}/100
        </text>
      </svg>

      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[0.65rem] text-slate-500 uppercase tracking-[0.1em] font-medium">
          SECURITY SCORE
        </span>
        {/* Info tooltip */}
        <div className="relative inline-flex">
          <button
            onClick={() => setShowInfo(!showInfo)}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            className="w-3.5 h-3.5 rounded-full bg-slate-600/50 text-slate-400 text-[0.5rem] font-bold flex items-center justify-center cursor-pointer hover:bg-slate-500/50 transition-colors border-none"
            aria-label="Score methodology info"
          >
            ?
          </button>
          {showInfo && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-slate-700/30 shadow-xl z-10">
              <div className="text-xs text-slate-300 font-semibold mb-1.5">¿Cómo se calcula el score?</div>
              <div className="text-[0.7rem] text-slate-400 leading-relaxed">
                Cada header de seguridad tiene un peso según su severidad (CSP=25, HSTS=15, CORS=15, etc.).<br /><br />
                <span className="text-slate-500">Score = sum(peso × grade) / 165 × 100</span><br /><br />
                Los pesos fueron definidos por el autor de la herramienta. No existe un estándar universal. El score es una <span className="text-slate-300">guía visual</span>, no una certificación de seguridad.
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-[var(--color-bg-elevated)] border-r border-b border-slate-700/30" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

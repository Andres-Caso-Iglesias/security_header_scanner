import { GRADE_COLORS } from '../types';

interface ScoreCircleProps {
  score: number;
  grade: string;
}

export function ScoreCircle({ score, grade }: ScoreCircleProps) {
  const color = GRADE_COLORS[grade] || '#64748b';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

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
      <span className="text-[0.65rem] text-slate-400 uppercase tracking-[0.1em] font-medium mt-0.5">
        SECURITY SCORE
      </span>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import type { ScanResult } from '../../types';
import { GRADE_COLORS } from '../../types';

interface HistoryEntry {
  id: number;
  url: string;
  score: number;
  grade: string;
  timestamp: string;
}

interface HistoryPanelProps {
  onSelect: (result: ScanResult) => void;
  refreshTrigger: number;
}

export function HistoryPanel({ onSelect, refreshTrigger }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history?limit=20');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silently fail - no history available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  async function loadScan(id: number) {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          onSelect(JSON.parse(data.result) as ScanResult);
        }
      }
    } catch {
      // silently fail
    }
  }

  async function deleteScan(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
      setTotal(prev => prev - 1);
    } catch {
      // silently fail
    }
  }

  if (entries.length === 0 && !loading) return null;

  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Historial ({total})
        </h2>
        <button
          onClick={fetchHistory}
          className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer bg-none border-none"
        >
          ↻
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {entries.map(entry => (
          <div
            key={entry.id}
            onClick={() => loadScan(entry.id)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-slate-700/10 bg-[var(--color-bg-surface)] cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors group"
          >
            {/* Grade dot */}
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${GRADE_COLORS[entry.grade] || '#64748b'}20`, color: GRADE_COLORS[entry.grade] || '#64748b' }}
            >
              {entry.grade}
            </span>

            {/* URL and time */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-300 truncate">{entry.url}</div>
              <div className="text-[0.65rem] text-slate-500">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Score */}
            <span className="text-xs font-semibold text-slate-400">{entry.score}</span>

            {/* Delete button */}
            <button
              onClick={(e) => deleteScan(entry.id, e)}
              className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-[var(--color-accent-red)] cursor-pointer bg-none border-none transition-opacity"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

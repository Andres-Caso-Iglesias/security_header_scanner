import { useState, useCallback } from 'react';
import type { ScanResult } from '../types';
import type { ScanStage, ScanStageStatus, StageInfo } from '../components/scan/ScanProgress';

type ScanErrorType = 'network' | 'timeout' | 'server' | 'validation' | 'unknown';

interface ScanError {
  type: ScanErrorType;
  message: string;
  details?: string;
}

function classifyError(err: unknown): ScanError {
  const msg = (err as Error)?.message || String(err);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION')) {
    return { type: 'network', message: 'No se pudo conectar con el servidor', details: 'Verifica que el backend esté corriendo en http://localhost:3000' };
  }
  if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('Timeout') || msg.includes('abort')) {
    return { type: 'timeout', message: 'La solicitud tardó demasiado', details: 'El servidor objetivo no respondió a tiempo. Intenta de nuevo o verifica la URL.' };
  }
  if (msg.startsWith('Error 4')) {
    return { type: 'validation', message: msg, details: 'Verifica la URL ingresada e intenta de nuevo.' };
  }
  if (msg.startsWith('Error 5')) {
    return { type: 'server', message: msg, details: 'El servidor de análisis encontró un error interno.' };
  }
  return { type: 'unknown', message: msg, details: 'Ocurrió un error inesperado.' };
}

const PROGRESS_TIMING: { stage: ScanStage; delayMs: number; message: string }[] = [
  { stage: 'http', delayMs: 300, message: 'Solicitando headers HTTP...' },
  { stage: 'tls', delayMs: 800, message: 'Verificando conexión TLS...' },
  { stage: 'dns', delayMs: 1500, message: 'Consultando registros DNS...' },
  { stage: 'security-files', delayMs: 2500, message: 'Buscando archivos de seguridad...' },
  { stage: 'sensitive-files', delayMs: 3500, message: 'Escaneando archivos sensibles...' },
  { stage: 'sri', delayMs: 4500, message: 'Analizando integridad de recursos (SRI)...' },
  { stage: 'fingerprint', delayMs: 5500, message: 'Identificando tecnologías...' },
  { stage: 'analysis', delayMs: 7000, message: 'Analizando resultados...' },
  { stage: 'complete', delayMs: 9000, message: 'Finalizando...' },
];

const ALL_STAGES: ScanStage[] = [
  'http', 'tls', 'dns', 'security-files',
  'sensitive-files', 'sri', 'fingerprint', 'analysis', 'complete',
];

interface UseScanReturn {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  scanStages: StageInfo[];
  scanMessage: string | undefined;
  result: ScanResult | null;
  error: ScanError | null;
  handleScan: () => Promise<void>;
  resetScan: () => void;
  selectHistory: (result: ScanResult) => void;
  historyRefresh: number;
}

export function useScan(): UseScanReturn {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<ScanError | null>(null);
  const [scanStages, setScanStages] = useState<StageInfo[]>([]);
  const [scanMessage, setScanMessage] = useState<string | undefined>();
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const resetScan = useCallback(() => {
    setUrl('');
    setLoading(false);
    setResult(null);
    setError(null);
    setScanStages([]);
    setScanMessage(undefined);
  }, []);

  const selectHistory = useCallback((result: ScanResult) => {
    setResult(result);
    setError(null);
  }, []);

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      setError({ type: 'validation', message: 'Ingresa una URL para escanear', details: 'La URL debe incluir el protocolo (https://...)' });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setScanStages([]);
    setScanMessage('Conectando...');

    const stageMap = new Map<ScanStage, ScanStageStatus>();
    ALL_STAGES.forEach(s => stageMap.set(s, 'pending'));
    setScanStages(ALL_STAGES.map(s => ({ stage: s, status: 'pending' as ScanStageStatus })));

    const simTimers: ReturnType<typeof setTimeout>[] = [];

    function updateStage(stage: ScanStage, status: ScanStageStatus, message?: string) {
      stageMap.set(stage, status);
      if (message) setScanMessage(message);
      setScanStages(Array.from(stageMap.entries()).map(([s, st]) => ({ stage: s, status: st })));
    }

    for (const p of PROGRESS_TIMING) {
      const timer = setTimeout(() => updateStage(p.stage, 'scanning', p.message), p.delayMs * 0.5);
      simTimers.push(timer);
      const doneTimer = setTimeout(() => updateStage(p.stage, 'complete'), p.delayMs);
      simTimers.push(doneTimer);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.message || `Error ${res.status}`;
        setError(classifyError(errMsg));
        return;
      }

      ALL_STAGES.forEach(s => stageMap.set(s, 'complete'));
      setScanStages(ALL_STAGES.map(s => ({ stage: s, status: 'complete' })));
      setScanMessage('Escaneo completado');
      setResult(data as ScanResult);
      setHistoryRefresh(n => n + 1);
      setLoading(false);
    } catch (e) {
      setError(classifyError(e));
    } finally {
      simTimers.forEach(t => clearTimeout(t));
      if (!result) setLoading(false);
    }
  }, [url, result]);

  return { url, setUrl, loading, scanStages, scanMessage, result, error, handleScan, resetScan, selectHistory, historyRefresh };
}

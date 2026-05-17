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
    setScanStages(ALL_STAGES.map(s => ({ stage: s, status: 'pending' as ScanStageStatus })));
    setScanMessage('Conectando...');

    const stageMap = new Map<ScanStage, ScanStageStatus>();
    ALL_STAGES.forEach(s => stageMap.set(s, 'pending'));

    const updateStage = (stage: ScanStage, status: ScanStageStatus, message?: string) => {
      stageMap.set(stage, status);
      if (message) setScanMessage(message);
      setScanStages(Array.from(stageMap.entries()).map(([s, st]) => ({ stage: s, status: st })));
    };

    let evtSource: EventSource | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let completed = false;

    try {
      evtSource = new EventSource(`/api/scan/stream?url=${encodeURIComponent(url.trim())}`);

      timeoutId = setTimeout(() => {
        if (!completed && evtSource) {
          evtSource.close();
          setError({ type: 'timeout', message: 'La solicitud tardó demasiado', details: 'El escaneo excedió el tiempo límite de 30 segundos.' });
          setLoading(false);
        }
      }, 30000);

      await new Promise<void>((resolve, reject) => {
        evtSource!.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data && typeof data === 'object' && 'score' in data) {
              completed = true;
              ALL_STAGES.forEach(s => stageMap.set(s, 'complete'));
              setScanStages(ALL_STAGES.map(s => ({ stage: s, status: 'complete' })));
              setScanMessage('Escaneo completado');
              setResult(data as ScanResult);
              setHistoryRefresh(n => n + 1);
              evtSource!.close();
              resolve();
            } else if (data && 'stage' in data && 'status' in data) {
              const stage = data.stage as ScanStage;
              const status = data.status as ScanStageStatus;
              const message = data.message as string | undefined;

              if (status === 'error') {
                completed = true;
                setError({ type: 'server', message: message || 'Error durante el escaneo', details: data.error });
                evtSource!.close();
                reject(new Error(message || 'Scan error'));
                return;
              }

              updateStage(stage, status, message);
            }
          } catch (parseErr) {
            // ignore malformed SSE events
          }
        };

        evtSource!.onerror = () => {
          if (!completed && evtSource) {
            evtSource.close();
            reject(new Error('Failed to fetch'));
          }
        };
      });
    } catch (e) {
      if (!completed) {
        setError(classifyError(e));
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (evtSource) evtSource.close();
      setLoading(false);
    }
  }, [url]);

  return { url, setUrl, loading, scanStages, scanMessage, result, error, handleScan, resetScan, selectHistory, historyRefresh };
}

import { useState } from 'react';
import { cn } from './lib/cn';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScanProgress } from './components/ScanProgress';
import type { ScanStage, ScanStageStatus, StageInfo } from './components/ScanProgress';
import { ScanForm } from './components/ScanForm';
import { MetaSection } from './components/MetaSection';
import { SslWarning } from './components/SslWarning';
import { HeaderGrid } from './components/HeaderGrid';
import { TlsSection } from './components/TlsSection';
import { DnsSection } from './components/DnsSection';
import { SriSection } from './components/SriSection';
import { FingerprintSection } from './components/FingerprintSection';
import { SensitiveSection } from './components/SensitiveSection';
import { RecommendationsSection } from './components/RecommendationsSection';
import { ComplianceGrid } from './components/ComplianceGrid';
import { SecurityFilesSection } from './components/SecurityFilesSection';
import type { ScanResult } from './types';

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

type TabId = 'headers' | 'compliance' | 'tls' | 'dns' | 'sri' | 'fingerprint' | 'sensitive' | 'recommendations';

const TABS: { id: TabId; label: string }[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'compliance', label: 'Cumplimiento' },
  { id: 'tls', label: 'TLS/SSL' },
  { id: 'dns', label: 'DNS' },
  { id: 'sri', label: 'SRI' },
  { id: 'fingerprint', label: 'Fingerprinting' },
  { id: 'sensitive', label: 'Sensibles' },
  { id: 'recommendations', label: 'Recomendaciones' },
];

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<ScanError | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('headers');
  const [scanStages, setScanStages] = useState<StageInfo[]>([]);
  const [scanMessage, setScanMessage] = useState<string | undefined>();

  // Simulated progress stages with calibrated timing
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

  async function handleScan() {
    if (!url.trim()) {
      setError({ type: 'validation', message: 'Ingresa una URL para escanear', details: 'La URL debe incluir el protocolo (https://...)' });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setScanStages([]);
    setScanMessage('Conectando...');

    // Initialize all stages as pending
    const stageMap = new Map<ScanStage, ScanStageStatus>();
    const allStages: ScanStage[] = [
      'http', 'tls', 'dns', 'security-files',
      'sensitive-files', 'sri', 'fingerprint', 'analysis', 'complete',
    ];
    allStages.forEach(s => stageMap.set(s, 'pending'));
    setScanStages(allStages.map(s => ({ stage: s, status: 'pending' as ScanStageStatus })));

    // Start simulated progress
    const simTimers: ReturnType<typeof setTimeout>[] = [];

    function updateStage(stage: ScanStage, status: ScanStageStatus, message?: string) {
      stageMap.set(stage, status);
      if (message) setScanMessage(message);
      setScanStages(Array.from(stageMap.entries()).map(([s, st]) => ({ stage: s, status: st })));
    }

    // Schedule progressive stage completions
    for (const p of PROGRESS_TIMING) {
      const timer = setTimeout(() => updateStage(p.stage, 'scanning', p.message), p.delayMs * 0.5);
      simTimers.push(timer);
      const doneTimer = setTimeout(() => updateStage(p.stage, 'complete'), p.delayMs);
      simTimers.push(doneTimer);
    }

    // Real scan via POST /api/scan
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

      // Mark all stages complete and show results immediately
      allStages.forEach(s => stageMap.set(s, 'complete'));
      setScanStages(allStages.map(s => ({ stage: s, status: 'complete' })));
      setScanMessage('Escaneo completado');
      setResult(data as ScanResult);
      setLoading(false);
    } catch (e) {
      setError(classifyError(e));
    } finally {
      // Cleanup sim timers
      simTimers.forEach(t => clearTimeout(t));
      if (!result) setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[#f1f5f9] font-['Inter',sans-serif]">
      {/* Header bar */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-[10px] h-[10px] rounded-full bg-[var(--color-accent-green)] inline-block" />
          <span className="font-bold text-lg text-white">Auditoría de Seguridad Web</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">v2.1</span>
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-green)] inline-block" />
          <span className="text-xs text-slate-400">Online</span>
        </div>
      </header>

      <main className="px-8 max-w-[1400px] mx-auto w-full">
        {/* Hero / Input */}
        {!result && !loading && !error && (
          <ScanForm url={url} loading={loading} onUrlChange={setUrl} onScan={handleScan} />
        )}

        {/* Loading state with progress */}
        {loading && (
          <div className="py-8">
            <ScanProgress stages={scanStages} message={scanMessage} />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl border my-6 animate-fade-in-up",
            error.type === 'validation' && "bg-yellow-500/10 border-yellow-500/20",
            error.type === 'network' && "bg-orange-500/10 border-orange-500/20",
            error.type === 'timeout' && "bg-orange-500/10 border-orange-500/20",
            error.type === 'server' && "bg-red-500/10 border-red-500/20",
            error.type === 'unknown' && "bg-red-500/10 border-red-500/20",
          )}>
            <div className={cn(
              "w-1 h-10 rounded-sm flex-shrink-0",
              error.type === 'validation' && "bg-[var(--color-accent-yellow)]",
              error.type === 'network' && "bg-[var(--color-accent-orange)]",
              error.type === 'timeout' && "bg-[var(--color-accent-orange)]",
              error.type === 'server' && "bg-[var(--color-accent-red)]",
              error.type === 'unknown' && "bg-[var(--color-accent-red)]",
            )} />
            <div className="flex-1">
              <strong className="text-sm text-white block">{error.message}</strong>
              {error.details && (
                <p className="text-xs text-slate-400 mt-1">{error.details}</p>
              )}
              <button
                onClick={handleScan}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-elevated)] text-slate-300 border border-slate-700/30 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            <MetaSection result={result} />
            <SslWarning tls={result.tls} />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/5 pb-2 mb-6 overflow-x-auto animate-fade-in-up">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in-up">
              {activeTab === 'headers' && (
                <ErrorBoundary title="Headers">
                  <HeaderGrid headers={result.headers} />
                </ErrorBoundary>
              )}
              {activeTab === 'compliance' && (
                <ErrorBoundary title="Cumplimiento">
                  <div className="w-screen ml-[calc(-50vw+50%)] px-8 box-border">
                    <ComplianceGrid compliance={result.compliance} />
                  </div>
                </ErrorBoundary>
              )}
              {activeTab === 'tls' && (
                <ErrorBoundary title="TLS/SSL">
                  <TlsSection tls={result.tls} />
                </ErrorBoundary>
              )}
              {activeTab === 'dns' && (
                <ErrorBoundary title="DNS">
                  <DnsSection dns={result.dns} />
                </ErrorBoundary>
              )}
              {activeTab === 'sri' && (
                <ErrorBoundary title="SRI">
                  <SriSection sri={result.sri} />
                </ErrorBoundary>
              )}
              {activeTab === 'fingerprint' && (
                <ErrorBoundary title="Fingerprinting">
                  <FingerprintSection fingerprint={result.fingerprint} />
                </ErrorBoundary>
              )}
              {activeTab === 'sensitive' && (
                <ErrorBoundary title="Sensibles">
                  <SensitiveSection sensitive={result.sensitiveFiles} />
                </ErrorBoundary>
              )}
              {activeTab === 'recommendations' && (
                <ErrorBoundary title="Recomendaciones">
                  <RecommendationsSection recommendations={result.recommendations} />
                </ErrorBoundary>
              )}
            </div>

            {/* Security files */}
            <ErrorBoundary title="Archivos de Seguridad">
              <SecurityFilesSection securityFiles={result.securityFiles} />
            </ErrorBoundary>

            {/* Footer */}
            <footer className="mt-12 py-5 border-t border-white/5 text-center text-xs text-slate-600">
              Herramienta de auditoría pasiva — Proyecto de Máster en Ciberseguridad — Andrés Caso Iglesias
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

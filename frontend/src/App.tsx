import { cn } from './lib/cn';
import { useScan } from './hooks/useScan';
import { useTabs } from './hooks/useTabs';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScanProgress } from './components/scan/ScanProgress';
import { ScanForm } from './components/scan/ScanForm';
import { MetaSection, SslWarning, HistoryPanel, HeaderGrid, TlsSection, DnsSection, SriSection, FingerprintSection, SensitiveSection, RecommendationsSection, ComplianceGrid, SecurityFilesSection } from './components/results';

export default function App() {
  const { url, setUrl, loading, scanStages, scanMessage, result, error, handleScan, selectHistory, historyRefresh } = useScan();
  const { activeTab, setActiveTab, tabs } = useTabs();

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[#f1f5f9] font-['Inter',sans-serif]">
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
        {!result && !loading && !error && (
          <ScanForm url={url} loading={loading} onUrlChange={setUrl} onScan={handleScan} />
        )}

        {loading && (
          <div className="py-8">
            <ScanProgress stages={scanStages} message={scanMessage} />
          </div>
        )}

        {error && (
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl border my-6 animate-fade-in-up",
            error.type === 'validation' && "bg-yellow-500/10 border-yellow-500/20",
            (error.type === 'network' || error.type === 'timeout') && "bg-orange-500/10 border-orange-500/20",
            (error.type === 'server' || error.type === 'unknown') && "bg-red-500/10 border-red-500/20",
          )}>
            <div className={cn(
              "w-1 h-10 rounded-sm flex-shrink-0",
              error.type === 'validation' && "bg-[var(--color-accent-yellow)]",
              (error.type === 'network' || error.type === 'timeout') && "bg-[var(--color-accent-orange)]",
              (error.type === 'server' || error.type === 'unknown') && "bg-[var(--color-accent-red)]",
            )} />
            <div className="flex-1">
              <strong className="text-sm text-white block">{error.message}</strong>
              {error.details && <p className="text-xs text-slate-400 mt-1">{error.details}</p>}
              <button onClick={handleScan} className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-elevated)] text-slate-300 border border-slate-700/30 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {result && (
          <div>
            <MetaSection result={result} />
            <SslWarning tls={result.tls} />

            <div className="flex gap-1 border-b border-white/5 pb-2 mb-6 overflow-x-auto animate-fade-in-up">
              {tabs.map((tab, i) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                  'px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                )} style={{ animationDelay: `${i * 0.04}s` }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="animate-fade-in-up">
              {activeTab === 'headers' && <ErrorBoundary title="Headers"><HeaderGrid headers={result.headers} /></ErrorBoundary>}
              {activeTab === 'compliance' && <ErrorBoundary title="Cumplimiento"><div className="w-screen ml-[calc(-50vw+50%)] px-8 box-border"><ComplianceGrid compliance={result.compliance} /></div></ErrorBoundary>}
              {activeTab === 'tls' && <ErrorBoundary title="TLS/SSL"><TlsSection tls={result.tls} /></ErrorBoundary>}
              {activeTab === 'dns' && <ErrorBoundary title="DNS"><DnsSection dns={result.dns} /></ErrorBoundary>}
              {activeTab === 'sri' && <ErrorBoundary title="SRI"><SriSection sri={result.sri} /></ErrorBoundary>}
              {activeTab === 'fingerprint' && <ErrorBoundary title="Fingerprinting"><FingerprintSection fingerprint={result.fingerprint} /></ErrorBoundary>}
              {activeTab === 'sensitive' && <ErrorBoundary title="Sensibles"><SensitiveSection sensitive={result.sensitiveFiles} /></ErrorBoundary>}
              {activeTab === 'recommendations' && <ErrorBoundary title="Recomendaciones"><RecommendationsSection recommendations={result.recommendations} /></ErrorBoundary>}
            </div>

            <ErrorBoundary title="Archivos de Seguridad"><SecurityFilesSection securityFiles={result.securityFiles} /></ErrorBoundary>
            <HistoryPanel onSelect={(r) => { selectHistory(r); setActiveTab('headers'); }} refreshTrigger={historyRefresh} />
            <footer className="mt-12 py-5 border-t border-white/5 text-center text-xs text-slate-600">
              Herramienta de auditoría pasiva — Proyecto de Máster en Ciberseguridad — Andrés Caso Iglesias
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from 'react';
import { cn } from './lib/cn';
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('headers');

  async function handleScan() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || `Error ${res.status}: Failed to scan URL`);
        return;
      }
      setResult(data as ScanResult);
    } catch (e) {
      setError(`Connection error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
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
          <span className="text-xs text-slate-500">v2.0</span>
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-green)] inline-block" />
          <span className="text-xs text-slate-400">Online</span>
        </div>
      </header>

      <main className="px-8 max-w-[1400px] mx-auto w-full">
        {/* Hero / Input */}
        {!result && !loading && !error && (
          <ScanForm url={url} loading={loading} onUrlChange={setUrl} onScan={handleScan} />
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-8">
            <LoadingSkeleton />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 my-6">
            <div className="w-1 h-6 rounded-sm bg-[var(--color-accent-red)]" />
            <div>
              <strong className="text-[var(--color-accent-red)] block">Error de escaneo</strong>
              <span className="text-sm text-slate-400">{error}</span>
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
              {activeTab === 'headers' && <HeaderGrid headers={result.headers} />}
              {activeTab === 'compliance' && (
                <div className="w-screen ml-[calc(-50vw+50%)] px-8 box-border">
                  <ComplianceGrid compliance={result.compliance} />
                </div>
              )}
              {activeTab === 'tls' && <TlsSection tls={result.tls} />}
              {activeTab === 'dns' && <DnsSection dns={result.dns} />}
              {activeTab === 'sri' && <SriSection sri={result.sri} />}
              {activeTab === 'fingerprint' && <FingerprintSection fingerprint={result.fingerprint} />}
              {activeTab === 'sensitive' && <SensitiveSection sensitive={result.sensitiveFiles} />}
              {activeTab === 'recommendations' && <RecommendationsSection recommendations={result.recommendations} />}
            </div>

            {/* Security files — always visible */}
            <SecurityFilesSection securityFiles={result.securityFiles} />

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

function LoadingSkeleton() {
  return (
    <div className="animate-fade-in-up">
      <div className="flex gap-6 items-center justify-center flex-wrap">
        <div className="w-[140px] h-[140px] rounded-full skeleton-pulse" />
        <div className="flex flex-col gap-3">
          <div className="w-[240px] h-5 rounded-md skeleton-pulse" />
          <div className="w-[180px] h-3.5 rounded-md skeleton-pulse" />
          <div className="w-[300px] h-3.5 rounded-md skeleton-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl skeleton-pulse" />)}
      </div>
      <div className="mt-6">
        <div className="h-10 rounded-xl skeleton-pulse mb-3" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-xl skeleton-pulse" />)}
        </div>
      </div>
    </div>
  );
}

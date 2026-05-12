import { useState } from 'react'
import './App.css'

interface HeaderResult {
  header: string
  present: boolean
  value: string | null
  grade: number
  severity: string
  weight: number
  finding: string
  recommendation: string
}

interface ComplianceFinding {
  control: string
  status: string
  relatedHeaders: string[]
  description: string
  recommendation: string
}

interface CertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  expiresInDays: number
  expired: boolean
  selfSigned: boolean
  wildcard: boolean
  fingerprint: string
  serialNumber: string
  san: string[]
}

interface TlsInfo {
  checked: boolean
  hostname: string
  port: number
  error: string | null
  tlsVersion: string | null
  certificate: CertificateInfo | null
  grade: number
}

interface ComplianceSection {
  framework: string
  version: string
  findings: ComplianceFinding[]
}

interface ScanResult {
  url: string
  timestamp: string
  score: number
  grade: string
  headers: HeaderResult[]
  compliance: ComplianceSection[]
  recommendations: string[]
  metadata: {
    responseTime: number
    statusCode: number
    analyzedAt: string
  }
  tls: TlsInfo
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: '#22c55e',
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    E: '#ef4444',
    F: '#dc2626',
  }
  return colors[grade] || '#6b7280'
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  }
  return colors[severity] || '#6b7280'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    compliant: '#22c55e',
    partially_compliant: '#eab308',
    non_compliant: '#dc2626',
    not_applicable: '#6b7280',
  }
  return colors[status] || '#6b7280'
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function ScoreCircle({ score, grade }: { score: number; grade: string }) {
  const color = getGradeColor(grade)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-circle">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#1f2937"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="score-text">
        <span className="grade" style={{ color }}>
          {grade}
        </span>
        <span className="score-value">{score}/100</span>
      </div>
    </div>
  )
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'json' | null>(null)

  async function handleScan() {
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || `Error ${res.status}: Failed to scan URL`)
        return
      }

      setResult(data as ScanResult)
    } catch (e) {
      setError(`Connection error: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleScan()
  }

  async function copyReport() {
    if (!result) return
    const text = JSON.stringify(result, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadReport(format: 'pdf' | 'json') {
    if (!result || !url.trim()) return
    setExporting(format)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format }),
      })
      if (!res.ok) throw new Error(`Export failed: ${res.status}`)
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const ext = format === 'pdf' ? 'pdf' : 'json'
      link.download = `auditoria-${url.trim().replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)}-${new Date().toISOString().slice(0, 10)}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (e) {
      setError(`Error al descargar: ${(e as Error).message}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Auditoría de Seguridad Web</h1>
        <p>Analizador pasivo de headers de seguridad HTTP</p>
      </header>

      <div className="scan-form">
        <input
          type="text"
          className="url-input"
          placeholder="https://ejemplo.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="scan-button"
          onClick={handleScan}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <span className="loading-spinner">⟳</span>
          ) : (
            'Escanear'
          )}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="loading-bar" />
          <p>Analizando headers de seguridad...</p>
        </div>
      )}

      {result && (
        <div className="results">
          <div className="result-header">
            <ScoreCircle score={result.score} grade={result.grade} />

            <div className="result-meta">
              <div className="meta-row">
                <span className="meta-label">URL</span>
                <span className="meta-value">{result.url}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Estado HTTP</span>
                <span className="meta-value">{result.metadata.statusCode}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Tiempo</span>
                <span className="meta-value">
                  {result.metadata.responseTime}ms
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Headers</span>
                <span className="meta-value">
                  {result.headers.length} analizados
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">TLS</span>
                <span className="meta-value">
                  {result.tls.tlsVersion || (result.tls.error ? 'Error' : 'No verificado')}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Recomendaciones</span>
                <span className="meta-value">
                  {result.recommendations.length}
                </span>
              </div>
            </div>
          </div>

          <div className="export-buttons">
            <button className="copy-button" onClick={copyReport}>
              {copied ? 'Copiado' : 'Copiar JSON'}
            </button>
            <button className="export-btn export-json" onClick={() => downloadReport('json')} disabled={exporting !== null}>
              {exporting === 'json' ? 'Descargando...' : 'Descargar JSON'}
            </button>
            <button className="export-btn export-pdf" onClick={() => downloadReport('pdf')} disabled={exporting !== null}>
              {exporting === 'pdf' ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>

          <section className="section">
            <h2>Headers de Seguridad</h2>
            <div className="header-grid">
              {result.headers.map((h) => (
                <div
                  key={h.header}
                  className={`header-card severity-${h.severity}`}
                >
                  <div className="header-card-top">
                    <span className="header-name">{h.header}</span>
                    <span
                      className="header-grade"
                      style={{ color: getSeverityColor(h.severity) }}
                    >
                      {h.grade === 1
                        ? '✓'
                        : h.grade > 0.5
                          ? '⚠'
                          : h.grade > 0
                            ? '✗'
                            : '✗'}
                    </span>
                  </div>
                  <div className="header-grade-bar">
                    <div
                      className="grade-fill"
                      style={{
                        width: `${h.grade * 100}%`,
                        backgroundColor: getSeverityColor(h.severity),
                      }}
                    />
                  </div>
                  <div className="header-card-info">
                    <span className="severity-badge">{h.severity}</span>
                    <span className="grade-value">
                      {Math.round(h.grade * 100)}%
                    </span>
                  </div>
                  <p className="header-finding">{h.finding}</p>
                  <p className="header-rec">{h.recommendation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Cumplimiento Normativo</h2>
            {result.compliance.map((comp) => (
              <div key={comp.framework} className="compliance-section">
                <h3>
                  {comp.framework} v{comp.version}
                </h3>
                <div className="compliance-grid">
                  {comp.findings.map((f) => (
                    <div
                      key={f.control}
                      className={`compliance-card status-${f.status}`}
                    >
                      <div className="compliance-card-header">
                        <span className="compliance-control">
                          {f.control}
                        </span>
                        <span
                          className="compliance-status"
                          style={{ color: getStatusColor(f.status) }}
                        >
                          {formatStatus(f.status)}
                        </span>
                      </div>
                      <p className="compliance-desc">{f.description}</p>
                      <p className="compliance-rec">{f.recommendation}</p>
                      {f.relatedHeaders.length > 0 && (
                        <div className="related-headers">
                          <small>Headers relacionados: </small>
                          {f.relatedHeaders.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="section">
            <h2>TLS / SSL</h2>
            {result.tls.error ? (
              <div className="error-banner">
                {result.tls.error}
              </div>
            ) : (
              <div className="tls-grid">
                <div className="tls-card">
                  <div className="tls-card-header">Conexion</div>
                  <div className="tls-card-body">
                    <div className="tls-row">
                      <span className="tls-label">Version TLS</span>
                      <span className="tls-value">{result.tls.tlsVersion || 'N/A'}</span>
                    </div>
                    <div className="tls-row">
                      <span className="tls-label">Host</span>
                      <span className="tls-value">{result.tls.hostname}:{result.tls.port}</span>
                    </div>
                    <div className="tls-row">
                      <span className="tls-label">Grade</span>
                      <span className={`tls-value tls-grade-${result.tls.grade >= 0.8 ? 'good' : result.tls.grade >= 0.5 ? 'warn' : 'bad'}`}>
                        {Math.round(result.tls.grade * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {result.tls.certificate && (
                  <>
                    <div className="tls-card">
                      <div className="tls-card-header">Certificado</div>
                      <div className="tls-card-body">
                        <div className="tls-row">
                          <span className="tls-label">Sujeto</span>
                          <span className="tls-value mono">{result.tls.certificate.subject}</span>
                        </div>
                        <div className="tls-row">
                          <span className="tls-label">Emisor</span>
                          <span className="tls-value mono">{result.tls.certificate.issuer}</span>
                        </div>
                        <div className="tls-row">
                          <span className="tls-label">Valido desde</span>
                          <span className="tls-value">{result.tls.certificate.validFrom}</span>
                        </div>
                        <div className="tls-row">
                          <span className="tls-label">Valido hasta</span>
                          <span className={`tls-value ${result.tls.certificate.expired ? 'tls-expired' : ''}`}>
                            {result.tls.certificate.validTo}
                            {result.tls.certificate.expired ? ' (EXPIRADO)' : result.tls.certificate.expiresInDays < 30 ? ` (${result.tls.certificate.expiresInDays} dias)` : ''}
                          </span>
                        </div>
                        <div className="tls-row">
                          <span className="tls-label">Self-signed</span>
                          <span className="tls-value">{result.tls.certificate.selfSigned ? 'Si' : 'No'}</span>
                        </div>
                        <div className="tls-row">
                          <span className="tls-label">Wildcard</span>
                          <span className="tls-value">{result.tls.certificate.wildcard ? 'Si' : 'No'}</span>
                        </div>
                        {result.tls.certificate.san.length > 0 && (
                          <div className="tls-row">
                            <span className="tls-label">SAN</span>
                            <span className="tls-value mono">{result.tls.certificate.san.slice(0, 5).join(', ')}{result.tls.certificate.san.length > 5 ? '...' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {result.recommendations.length > 0 && (
            <section className="section">
              <h2>Recomendaciones</h2>
              <ul className="recommendations-list">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="recommendation-item">
                    {rec}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <footer className="footer">
        <p>
          Herramienta de auditoría pasiva — Proyecto de Master en
          Ciberseguridad — Andres Caso Iglesias
        </p>
      </footer>
    </div>
  )
}

export default App

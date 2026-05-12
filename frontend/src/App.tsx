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

interface DnsRecord {
  type: string
  value: string
  present: boolean
  grade: number
  finding: string
  recommendation: string
}

interface SecurityFileCheck {
  path: string
  present: boolean
  statusCode: number | null
  content: string | null
  grade: number
  finding: string
  recommendation: string
}

interface SriResource {
  tag: string
  src: string
  hasIntegrity: boolean
}

interface SriInfo {
  checked: boolean
  totalResources: number
  secureResources: number
  insecureResources: SriResource[]
  grade: number
  finding: string
  recommendation: string
}

interface SensitiveFileResult {
  path: string
  statusCode: number | null
  exposed: boolean
  finding: string
}

interface DetectedTech {
  name: string
  version: string | null
  category: string
  confidence: string
  evidence: string[]
}

interface CveInfo {
  id: string
  description: string
  severity: string
  affectedVersions: string
}

interface TechFingerprintInfo {
  checked: boolean
  technologies: DetectedTech[]
  cves: CveInfo[]
  grade: number
  summary: string
}

interface SensitiveFilesInfo {
  checked: boolean
  files: SensitiveFileResult[]
  exposedCount: number
  grade: number
}

interface SecurityFileInfo {
  checked: boolean
  securityTxt: SecurityFileCheck
  robotsTxt: SecurityFileCheck
  grade: number
}

interface DnsInfo {
  hostname: string
  checked: boolean
  error: string | null
  spf: DnsRecord
  dkim: DnsRecord
  dmarc: DnsRecord
  grade: number
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
  dns: DnsInfo
  securityFiles: SecurityFileInfo
  sri: SriInfo
  sensitiveFiles: SensitiveFilesInfo
  fingerprint: TechFingerprintInfo
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
  const [expandedSri, setExpandedSri] = useState<Set<number>>(new Set())
  const [expandedRec, setExpandedRec] = useState<Set<string>>(new Set())

  function toggleSri(i: number) {
    setExpandedSri((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function toggleRec(key: string) {
    setExpandedRec((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

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
        <label htmlFor="url-input" className="sr-only">URL a escanear</label>
        <input
          id="url-input"
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
                <span className="meta-label">DNS</span>
                <span className="meta-value">
                  {result.dns.error ? 'Error' : `SPF ${result.dns.spf.present ? 'OK' : '--'} DKIM ${result.dns.dkim.present ? 'OK' : '--'} DMARC ${result.dns.dmarc.present ? 'OK' : '--'}`}
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

          {result.tls.checked && result.tls.certificate && (result.tls.certificate.expired || (result.tls.certificate.expiresInDays >= 0 && result.tls.certificate.expiresInDays < 30)) && (
            <div className={`ssl-warning ${result.tls.certificate.expired ? 'ssl-expired' : 'ssl-expiring'}`}>
              <strong>{result.tls.certificate.expired ? 'CERTIFICADO EXPIRADO' : 'Certificado proximo a expirar'}</strong>
              <span>
                {result.tls.certificate.expired
                  ? `El certificado SSL expiro el ${result.tls.certificate.validTo}. Debe renovarse inmediatamente.`
                  : `El certificado SSL expira en ${result.tls.certificate.expiresInDays} dias (${result.tls.certificate.validTo}). Renueve antes de la fecha de vencimiento.`}
              </span>
            </div>
          )}

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

          <div className="columns-layout">
            <div className="column-main">
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
            </div>

            <div className="column-side">
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
            </div>
          </div>

          <div className="row-half">
            <div className="col-half">
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
            </div>

            <div className="col-half">
              <section className="section">
                <h2>DNS / Email Security</h2>
                {result.dns.error ? (
                  <div className="error-banner">{result.dns.error}</div>
                ) : (
                  <div className="dns-grid">
                    {[result.dns.spf, result.dns.dkim, result.dns.dmarc].map((record) => (
                      <div key={record.type} className={`dns-card grade-${record.grade >= 1 ? 'good' : record.grade >= 0.5 ? 'warn' : 'bad'}`}>
                        <div className="dns-card-header">
                          <span className="dns-type">{record.type}</span>
                          <span className="dns-status">{record.present ? 'Configurado' : 'AUSENTE'}</span>
                        </div>
                        {record.value && (
                          <div className="dns-value">{record.value}</div>
                        )}
                        <p className="dns-finding">{record.finding}</p>
                        {record.grade < 1.0 && (
                          <p className="dns-rec">{record.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className="section">
            <h2>Archivos de Seguridad</h2>
            <div className="security-files-grid">
              {[result.securityFiles.securityTxt, result.securityFiles.robotsTxt].map((file) => (
                <div key={file.path} className={`security-card ${file.present ? 'found' : 'missing'}`}>
                  <div className="security-card-header">
                    <span className="security-path">{file.path}</span>
                    <span className={`security-status ${file.present ? 'status-ok' : 'status-missing'}`}>
                      {file.present ? 'Encontrado' : 'No encontrado'}
                    </span>
                  </div>
                  {file.content && (
                    <pre className="security-content">{file.content}</pre>
                  )}
                  <p className="security-finding">{file.finding}</p>
                  {file.grade < 1.0 && (
                    <p className="security-rec">{file.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Subresource Integrity (SRI)</h2>
            {result.sri.totalResources === 0 ? (
              <p className="no-data">No se detectaron recursos externos (scripts o estilos) en la pagina.</p>
            ) : (
              <div className="sri-summary">
                <div className={`sri-grade ${result.sri.grade >= 1 ? 'good' : result.sri.grade >= 0.5 ? 'warn' : 'bad'}`}>
                  <span className="sri-stat">{result.sri.secureResources}/{result.sri.totalResources}</span>
                  <span className="sri-label">recursos con SRI</span>
                </div>
                <p className="sri-finding">{result.sri.finding}</p>
                {result.sri.insecureResources.length > 0 && (
                  <>
                    <p className="sri-rec">{result.sri.recommendation}</p>
                    <div className="sri-list">
                      {result.sri.insecureResources.map((r, i) => (
                        <div key={i} className="sri-item">
                          <span className="sri-tag">{r.tag}</span>
                          <span className={`sri-src ${!expandedSri.has(i) ? 'truncated' : ''}`} onClick={() => toggleSri(i)}>
                            {r.src}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="section">
            <h2>Archivos Sensibles</h2>
            {result.sensitiveFiles.exposedCount === 0 ? (
              <p className="no-data">No se detectaron archivos sensibles expuestos.</p>
            ) : (
              <div>
                <div className="sens-warning">
                  <strong>{result.sensitiveFiles.exposedCount} archivo(s) sensible(s) expuesto(s)</strong>
                </div>
                <div className="sens-list">
                  {result.sensitiveFiles.files.filter((f) => f.exposed).map((f, i) => (
                    <div key={i} className="sens-item">
                      <span className="sens-path">{f.path}</span>
                      <span className="sens-finding">{f.finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="section">
            <h2>Huella Digital (Fingerprinting)</h2>
            <p className="fp-summary">{result.fingerprint.summary}</p>
            {result.fingerprint.technologies.length > 0 && (
              <div className="fp-grid">
                {result.fingerprint.technologies.map((tech, i) => (
                  <div key={i} className="fp-card">
                    <div className="fp-card-top">
                      <span className="fp-name">{tech.name}</span>
                      {tech.version && <span className="fp-version">{tech.version}</span>}
                      <span className={`fp-confidence ${tech.confidence}`}>{tech.confidence}</span>
                    </div>
                    <span className="fp-category">{tech.category}</span>
                    {tech.evidence.map((e, j) => (
                      <div key={j} className="fp-evidence">{e}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {result.fingerprint.cves.length > 0 && (
              <div className="cve-section">
                <h3>CVEs Detectados ({result.fingerprint.cves.length})</h3>
                {result.fingerprint.cves.map((cve, i) => (
                  <div key={i} className={`cve-card severity-${cve.severity}`}>
                    <div className="cve-top">
                      <span className="cve-id">{cve.id}</span>
                      <span className={`cve-severity ${cve.severity}`}>{cve.severity}</span>
                    </div>
                    <p className="cve-desc">{cve.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {result.recommendations.length > 0 && (
            <div className="rec-fullwidth">
              <h2>Recomendaciones</h2>
              <div className="rec-columns">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
                    const items = result.recommendations.filter((r) => r.startsWith(`[${severity}]`))
                    if (items.length === 0) return null
                    const sevColor = severity === 'CRITICAL' ? '#dc2626'
                      : severity === 'HIGH' ? '#f97316'
                      : severity === 'MEDIUM' ? '#eab308' : '#94a3b8'
                    return (
                      <div key={severity} className="rec-column">
                        <h3 className="rec-column-title" style={{ color: sevColor }}>{severity}</h3>
                        <ul className="rec-column-list">
                          {items.map((rec, i) => (
                            <li key={i} className={`rec-column-item ${!expandedRec.has(`${severity}-${i}`) ? 'truncated' : ''}`} onClick={() => toggleRec(`${severity}-${i}`)}>
                              {rec.replace(`[${severity}] `, '')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
              </div>
            </div>
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

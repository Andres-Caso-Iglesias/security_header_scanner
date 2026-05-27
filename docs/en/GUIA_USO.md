# Usage Guide and Results Interpretation — Security Header Scanner & Quick Assessment Tool

> **ACADEMIC PROJECT**
>
> This tool was developed as a Master's project in Cybersecurity with educational purposes.
> Results are INDICATIVE and do not constitute a professional security audit.
> **Do not blindly trust results — manually verify critical findings.**

Practical guide to using the Security Header Scanner & Quick Assessment Tool and understanding analysis results.

## Table of Contents

- [How to Scan a Website](#how-to-scan-a-website)
- [Report Interpretation](#report-interpretation)
  - [General Score and Grade](#general-score-and-grade)
  - [Results by Header](#results-by-header)
  - [Normative Compliance](#normative-compliance)
  - [Recommendations](#recommendations)
- [Glossary of Security Headers](#glossary-of-security-headers)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Limitations](#limitations)

## How to Scan a Website

### Via Web Interface

1. Ensure backend and frontend are running
2. Open http://localhost:5173 in your browser
3. Enter the complete URL including protocol (https://example.com)
4. Press Enter or click "Scan"
5. Wait a few seconds while headers are analyzed
6. Review the generated report with headers, TLS, DNS, security files, SRI, sensitive files, fingerprinting, and recommendations sections
7. If SSL certificate is expired or about to expire, a prominent warning will appear at the top of the report
8. Long texts (SRI URLs, recommendations) are truncated with a click to expand full content
9. The **History** panel (on the right) shows previous scans. You can load a previous result or delete history entries

### Via API (curl)

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com"}'
```

### Via Swagger UI

1. Open http://localhost:3000/api/docs
2. Expand the POST /api/scan endpoint
3. Click "Try it out"
4. Enter the URL and execute

### Real-time Progress Scan (SSE)

The tool supports a streaming endpoint that sends progress events while the scan executes. The frontend consumes this endpoint via `EventSource` to show a REAL progress bar (not simulated):

```bash
curl -N http://localhost:3000/api/scan/stream?url=https://ejemplo.com
```

Each scan stage emits an event with `stage`, `status`, and `message`. When finished, the complete report is sent.

> **Note:** The frontend NO LONGER uses simulated timeouts. Progress reflects the real scan state on the server.

### Health Check

```bash
curl http://localhost:3000/health
```

Returns service health status, including uptime, memory usage, and SQLite database connectivity:

```json
{
  "status": "ok",
  "timestamp": "2026-05-17T12:00:00.000Z",
  "uptime": 123.45,
  "memory": { "rss": 123456789, "heapTotal": 45678901, "heapUsed": 34567890 },
  "database": { "status": "connected", "path": "data/scans.db" }
}
```

If the database does not respond, `status` will be `"degraded"` and `database.status` will be `"disconnected"`.

### Scan History

```bash
# List history
curl http://localhost:3000/api/history

# Get specific scan
curl http://localhost:3000/api/history/1

# Delete scan
curl -X DELETE http://localhost:3000/api/history/1
```

### Export PDF Report

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com","format":"pdf"}' \
  --output reporte-auditoria.pdf
```

### Export JSON Report

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com","format":"json"}' \
  --output reporte-auditoria.json
```

### Via Web Interface - Export

Once the report is generated, three buttons appear below the summary:

- **Copy JSON**: copies the full report to clipboard
- **Download JSON**: downloads the report as .json file
- **Download PDF**: generates a professional PDF document ready for use as technical evidence

## Report Interpretation

### General Score and Grade

The numeric score (0-100) and letter grade (A-F) summarize the site's overall security posture:

| Grade | Range | Meaning |
|-------|-------|---------|
| A | 90-100 | Excellent. Most security headers are present and correctly configured. |
| B | 80-89 | Good. Some minor headers need adjustment. |
| C | 70-79 | Acceptable. Several important headers need configuration. |
| D | 60-69 | Deficient. Critical security headers are missing or misconfigured. |
| E | 50-59 | Poor. Most security headers are absent. |
| F | 0-49 | Critical. Site lacks essential protections. Vulnerable to multiple attacks. |

The score calculation is based on the weighted average of 15 security headers, where each header has a weight according to its severity (critical=25, high=15, medium=10, low=5). The maximum possible score is 165 points.

### Results by Header

Each analyzed header shows:

```
Content-Security-Policy         State: warning (0.4)
Severity: critical
Finding: CSP is present but contains unsafe-inline
Recommendation: Remove unsafe directives. Consider using nonces or hashes.
```

- **Progress Bar**: Visually indicates rating from 0% to 100%
- **Severity**: Indicates header importance for security:
  - **critical**: Absence or misconfiguration exposes to grave vulnerabilities (XSS, injection)
  - **high**: Significant risk (clickjacking, MITM, session hijacking)
  - **medium**: Moderate risk (information leakage, MIME sniffing)
  - **low**: Minor risk (fingerprinting, deprecated headers)
- **Finding**: Describes current header state and why it receives that rating
- **Recommendation**: Concrete action to improve header configuration

### Normative Compliance

The report includes four compliance sections:

The 4 evaluated frameworks are: OWASP Top 10, NIS2 Directive, ENS (National Security Scheme) and ISO 27001.

#### OWASP Top 10 (2021)

| Control | Evaluates | What it means |
|---------|-----------|---------------|
| A01 - Broken Access Control | CORS, cookies | Evaluates if there are weak access controls allowing unauthorized access |
| A05 - Security Misconfiguration | Security headers, TLS/SSL, SPF/DKIM/DMARC, security.txt, robots.txt | Evaluates if essential security headers are missing, TLS outdated, certificates expired, email DNS records missing, security files missing or misconfigured |
| A06 - Vulnerable Components | X-Powered-By, Server | Evaluates if the site exposes information about technologies that could have known vulnerabilities |

#### ENS - National Security Scheme (RD 311/2022)

| Control | Evaluates | What it means |
|---------|-----------|---------------|
| op.acc.2 - Access Control | CORS, COOP, cookies | Verifies no cross-access without restriction |
| op.exp.5 - Information Protection | X-Powered-By, Server | Detects technological information leaks |
| op.pl.3 - Perimeter Security | CSP, HSTS, XFO | Evaluates web perimeter defenses |
| op.mon.2 - Monitoring | DMARC | Incident detection capability for email |
| op.cont.2 - Continuity | TLS cert expiry | Certificate renewal and service continuity |
| org.organizacion - Organizational Framework | security.txt | Publication of vulnerability disclosure channel |
| op.vuln - Vulnerability Management | Fingerprinting, CVEs | Identification and patching of vulnerable technologies |

#### ISO 27001 (2022)

| Control | Evaluates | What it means |
|---------|-----------|---------------|
| A.5.1 - Security Policies | security.txt | Existence of disclosure policy |
| A.9.1 - Access Control | CORS, COOP | Cross-origin access restriction |
| A.10.1 - Cryptographic Controls | HSTS, TLS | Communication encryption |
| A.12.6 - Vulnerability Management | CVEs | Known vulnerabilities without patching |
| A.13.1 - Network Security | CSP, XFO, XCTO | Network perimeter defense |
| A.13.2 - Information Transfer | TLS | Encryption in data transfer |
| A.16.1 - Incident Management | CSP reporting, DMARC | Detection mechanisms |
| A.18.1 - Normative Compliance | Global | Global compliance status |

#### NIS2 Directive (2023) - Article 21

| Control | Evaluates | What it means |
|---------|-----------|---------------|
| Art.21(c) - Access Control | CORS, cookies, COOP | Access control measures to systems and data |
| Art.21(d) - Incident Handling | CSP reporting | Capability to detect and report security incidents |
| Art.21(g) - Supply Chain Security | CORP, COEP | Supply chain security measures |
| Art.21(i) - Cryptography | HSTS, TLS version, SSL certificate | Use of encryption and secure communications. Verifies real TLS version, certificate validity, and HSTS configuration |

Compliance states are:
- **compliant**: Control is satisfactorily met
- **partially_compliant**: Control is partially met, requires improvements
- **non_compliant**: Control is not met
- **not_applicable**: Control does not apply (e.g., no cookies to evaluate)

### Recommendations

The recommendations section lists concrete actions ordered by priority:

```
[CRITICAL] Implement a strict CSP policy...
[HIGH] Add HSTS with max-age=31536000...
[MEDIUM] Configure Referrer-Policy...
[LOW] Remove X-Powered-By header...
```

It is recommended to address recommendations in order of severity: critical first, then high, medium, and finally low.

## Glossary of Security Headers

### TLS / SSL

The tool performs a real TLS connection with the target server to verify certificate state and protocol version. This information appears in the TLS/SSL report section, in the same row as DNS results.

Additionally, DNS security records for email (SPF, DKIM, DMARC) are consulted to evaluate protection against domain spoofing. These results appear in the DNS / Email Security section.

**Data verified:**

| Data | Meaning |
|------|---------|
| TLS Version | Negotiated TLS protocol version (TLSv1.3, TLSv1.2, etc.). TLS 1.2 or superior is current standard. TLS 1.0 and 1.1 are deprecated and insecure. |
| Certificate - Subject | Common Name (CN) and organization to which the certificate belongs. Must match scanned domain. |
| Certificate - Issuer | Certification Authority (CA) that issued the certificate. Recognized CAs (Let's Encrypt, DigiCert, Amazon, etc.) indicate a valid certificate. |
| Valid From / To | Certificate validity dates. |
| Expired | Indicates if certificate is outside its validity period. An expired certificate is CRITICAL. |
| Self-signed | Indicates if certificate is self-signed (issuer equals subject). Self-signed certificates are not reliable for production. |
| Wildcard | Indicates if certificate uses a wildcard (`*.dominio.com`). Wildcards are functional but represent higher risk if private key is compromised. |
| Fingerprint | SHA256 digital fingerprint of the certificate. Useful for manual certificate identity verification. |
| SAN (Subject Alternative Names) | List of additional domains for which the certificate is valid. |

**TLS Grade:**

The TLS grade combines protocol version (50%) and certificate quality (50%):

- TLSv1.3 = maximum score
- TLSv1.2 = good
- TLSv1.1 = low (deprecated)
- TLSv1.0 = zero (insecure)
- Valid non-wildcard certificate = maximum score
- Wildcard certificate = slight penalty
- Self-signed certificate = strong penalty
- Expired certificate = zero

**Interpretation Example:**

```
TLS version: TLSv1.2     -> good, modern version
Cert issuer: Amazon CA   -> recognized CA, reliable
Self-signed: false       -> correct
Wildcard: true           -> functional but higher risk
Expires in: 97 days      -> renewal not urgent
Grade: 0.75 (75%)        -> acceptable, improvable
```

### /.well-known/security.txt (RFC 9116)

**Severity:** medium  
**Purpose:** Provides a standard for security researchers to report vulnerabilities.

The security.txt file allows administrators to publish contact information and policies for security vulnerability reporting. It must be located at `/.well-known/security.txt` of the domain.

**Required Fields (RFC 9116):**
- `Contact:` Address (URL or email) for reporting vulnerabilities
- `Expires:` Date and time after which information is no longer valid

**Recommended Fields:**
- `Encryption:` URL with public key for encrypted communication
- `Policy:` URL with vulnerability disclosure policy

**Evaluation:**
- With Contact and Expires = RFC 9116 compliant
- Only Contact = partially compliant
- Without Contact = does not comply with standard

### SRI (Subresource Integrity)

**Severity:** medium  
**Purpose:** Ensure resources loaded from CDNs or third parties have not been modified.

The `integrity` attribute in `<script>` and `<link rel="stylesheet">` tags allows the browser to verify that the resource has not been altered via cryptographic hash.

**Evaluation:**
- All external resources have integrity = secure configuration
- Resources without integrity = risk of compromise via CDN or third parties
- No external resources = not applicable

### Sensitive Files

Passive scan of 40 common paths that may expose critical information. Includes false positive detection:

| Path | Risk |
|------|------|
| `.env` | Database credentials, API keys |
| `.git/config` | Complete repository history |
| `phpinfo.php` | Complete server configuration |
| `web.config` / `.htaccess` | Web server configuration |
| `wp-config.php` | WordPress credentials |
| `credentials.json` | Cloud service credentials |
| `Dockerfile` | Container configuration |
| `backup/`, `logs/`, `private/` | Directories with sensitive content |

**Result Confidence:** Each finding includes a confidence level:
- **high**: Non-HTML response (JSON, plain text) — probable real exposure
- **medium**: Small HTML response — possible simple page
- **low**: Large HTML response — probable soft 404, verify manually

### Technology Fingerprinting

Identifies site's technological stack: CMS, framework, server, runtime, and CDN. When a concrete version is detected, it queries:
1. **Local database** of 20 known CVEs
2. **OSV.dev API** (Google Open Source Vulnerabilities) — real-time query with millions of updated records

**Detectable Technologies (23):** WordPress, Joomla, Drupal, PHP, Express, ASP.NET, Laravel, Django, Nginx, Apache, Cloudflare, jQuery, Bootstrap, Google Analytics, Vite, Webpack, Next.js, Nuxt.js, Ruby on Rails, Tomcat, IIS, Gunicorn, Node.js, Python.

**Confidence Interpretation:**
- **high**: Detected by meta generator, explicit header, or unequivocal pattern
- **medium**: Detected by route patterns or references
- **low**: Detected by indirect reference

### /robots.txt

**Severity:** low  
**Purpose:** Guide crawlers on which routes they can or cannot access.

The robots.txt file controls crawler and bot behavior. Although its purpose is legitimate, `Disallow` paths can reveal directories administrators consider sensitive.

**Evaluation:**
- With User-agent and Disallow = correctly configured
- Without Disallow = allows all access
- Sensitive paths exposed (admin, backup, .git, .env, config) = information risk

### SPF (Sender Policy Framework)

**Severity:** medium  
**Protection Against:** Email spoofing, domain impersonation

SPF allows administrators to specify which servers are authorized to send email from the domain. Published as a TXT record in DNS.

**Expected Value:** `v=spf1 include:_spf.google.com -all`

**Evaluation:**
- `-all` (hard fail): only authorized servers can send, rest is rejected
- `~all` (soft fail): unauthorized servers are marked but accepted (monitoring)
- `?all` (neutral): no action taken
- `+all` (pass): any server can send (insecure)

### DKIM (DomainKeys Identified Mail)

**Severity:** medium  
**Protection Against:** Email manipulation

DKIM allows digitally signing emails to verify they were not altered in transit. Public key is published in DNS as `{selector}._domainkey.{dominio}`.

**Expected Value:** `v=DKIM1; k=rsa; p=<public-key>`

**Note:** The tool tests 6 common selectors (default, google, selector1, selector2, dkim, mail). Some providers use custom selectors that may not be detected.

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Severity:** medium  
**Protection Against:** Email spoofing, phishing

DMARC instructs email servers on how to handle messages that fail SPF and DKIM verifications. Published as `_dmarc.{dominio}`.

**Expected Value:** `v=DMARC1; p=reject; rua=mailto:dmarc@tudominio.com`

**Policies:**
- `p=reject`: Reject emails that fail validation (maximum protection)
- `p=quarantine`: Mark as spam emails that fail validation
- `p=none`: Take no action, only monitor

### Content-Security-Policy (CSP)

**Severity: critical**  
**Protection Against:** XSS (Cross-Site Scripting), data injection

CSP controls which resources can load and execute in the browser. A strict policy restricts scripts, styles, and other resources to trusted origins.

**Expected Value:** Restrictive policy with default-src, script-src, object-src directives. Avoid unsafe-inline and unsafe-eval.

**Secure Example:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

### Strict-Transport-Security (HSTS)

**Severity: high**  
**Protection Against:** SSL stripping, MITM attacks

Forces browser to communicate exclusively via HTTPS, preventing attacks that downgrade connection to HTTP.

**Expected Value:** `max-age=31536000; includeSubDomains; preload`

### X-Frame-Options (XFO)

**Severity: high**  
**Protection Against:** Clickjacking

Controls if page can be displayed within a frame/iframe on other sites.

**Expected Value:** `DENY` (no frames allowed) or `SAMEORIGIN` (allow only same origin)

### X-Content-Type-Options

**Severity: medium**  
**Protection Against:** MIME sniffing

Prevents browser from interpreting files as a different MIME type than declared by server.

**Expected Value:** `nosniff`

### Referrer-Policy

**Severity: medium**  
**Protection Against:** Referrer information leakage

Controls how much origin URL information is sent in the Referer header when navigating to other sites.

**Expected Value:** `strict-origin-when-cross-origin`

### Permissions-Policy

**Severity: medium**  
**Protection Against:** Browser API abuse

Allows restricting access to sensitive APIs like geolocation, camera, microphone, notifications, etc.

### Cache-Control

**Severity: medium**  
**Protection Against:** Sensitive data caching

Controls how and for how long browsers and intermediate proxies can cache the response.

**Expected Value (sensitive data):** `no-store`

### Access-Control-Allow-Origin (CORS)

**Severity: high**  
**Protection Against:** Unauthorized cross-origin access

Controls which external origins can access server resources via JavaScript.

**Expected Value:** Specific origin or absent (never wildcard `*`)

### Set-Cookie

**Severity: high**  
**Protection Against:** Session hijacking, XSS, CSRF

Cookies must include security flags:
- **Secure**: Only sent via HTTPS
- **HttpOnly**: Not accessible from JavaScript
- **SameSite**: Controls sending in cross-site requests

### Cross-Origin-Resource-Policy (CORP)

**Severity: medium**  
**Protection Against:** Cross-origin data leakage

Controls which origins can load site's resources.

**Expected Value:** `same-origin`

### Cross-Origin-Opener-Policy (COOP)

**Severity: medium**  
**Protection Against:** Spectre-type attacks, window leakage

Isolates browsing context to prevent cross-origin windows from accessing current window.

**Expected Value:** `same-origin`

### Cross-Origin-Embedder-Policy (COEP)

**Severity: low**  
**Protection Against:** Unauthorized cross-origin embedding

Requires cross-origin resources to have explicit permission to be loaded.

**Expected Value:** `require-corp`

### X-Powered-By

**Severity: low**  
**Risk:** Technology fingerprinting

Reveals technology/version used by server (e.g., Express, PHP). Should be removed to hinder fingerprinting.

### Server

**Severity: low**  
**Risk:** Server fingerprinting

Similar to X-Powered-By but at web server level. Should be minimal or absent.

### X-XSS-Protection

**Severity: low** (deprecated)  
**Note:** This header is deprecated in modern browsers. XSS protection should be implemented via CSP.

## Frequently Asked Questions

### Why did my site get a low score?

Low scores generally result from:
1. Absence of critical security headers (CSP, HSTS, XFO)
2. Headers present but misconfigured (CORS with wildcard, CSP with unsafe-inline)
3. Headers revealing technological information (X-Powered-By, Server verbose)

Review the report's recommendations to identify which headers to correct first.

### Do I need an API Key to use the tool?

It depends on server configuration:
- **No API Key (default)**: free access to all endpoints
- **With API Key**: all requests must include `X-API-Key` header

If you see `401 Unauthorized` errors, contact the server administrator for an API Key.

### Why do I see "429 Too Many Requests"?

The server has a limit of 20 requests per minute per IP address. Wait a minute and try again. This limit is configurable by the server administrator.

### What does a grade of 1.0 mean for CORS or Set-Cookie when the header is absent?

For CORS and Set-Cookie, header absence is considered secure:
- No CORS header: browser does not allow cross-origin requests (secure default behavior)
- No cookies: no sessions to protect

If your site needs CORS or cookies, the checker evaluates when the header is present.

### Can the tool scan any site?

The tool can scan any publicly accessible URL via HTTP/HTTPS. However:
- Some sites block automated requests (known User-Agent)
- Sites behind Cloudflare or other WAFs may return block pages instead of real content
- The tool only analyzes headers, does not execute JavaScript or analyze content
- **SSRF Protection**: URLs pointing to private IPs, localhost, or internal networks are not allowed. This includes ranges `10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `169.254.x` (cloud provider metadata), and loopback IPv6. This protection prevents Server-Side Request Forgery attacks and applies in both initial validation and before each HTTP/TLS request.

### What happens if I try to scan an internal URL?

The tool automatically rejects URLs pointing to private networks with a `400 Bad Request` error. This includes:
- Private IPs: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`
- Loopback: `127.0.0.1`, `localhost`, `::1`
- Cloud metadata: `169.254.169.254` (AWS, GCP, Azure)
- IPv6 privates: `fc00::/7`, `fe80::/10`

This protection is intentional and prevents the tool from being used as an SSRF attack vector against internal infrastructure.

### How reliable is the compliance analysis?

The compliance analysis (OWASP Top 10, NIS2) is based exclusively on HTTP security headers. These frameworks are much broader and include organizational, process, and technical requirements that cannot be verified solely with headers. The compliance report should be considered a partial indication, not a complete audit.

## Limitations

1. **Only HTTP Headers**: The tool does not analyze HTML content, JavaScript, or perform active scanning
2. **No Authentication**: Does not support scanning behind login or authenticated sessions
3. **No Content Analysis**: Does not detect XSS or SQLi vulnerabilities in response body
4. **SQLite History**: Scans are automatically saved in a local SQLite database (`data/scans.db`). Can be consulted, loaded, and deleted via API or web interface. History is local to the server — no synchronization between instances
5. **Network Dependency**: Results depend on connectivity with destination; firewalls, WAFs, and CDNs can affect received headers
6. **Basic CSP**: CSP analysis verifies main directives but does not evaluate complete policy
7. **Academic Scope**: The tool was developed as a master's project and **should not be used as the sole instrument for professional auditing**
8. **CVEs**: Combines local database (20 CVEs) with real-time OSV.dev query (millions of records). OSV.dev query depends on Internet connectivity. Lack of detection does NOT imply the site is vulnerability-free
9. **Indicative Compliance**: Mapping to normative frameworks is automatic and partial. Does not replace a real compliance audit
10. **False Positives in Sensitive Files**: Scanning paths like `/.env` can generate false positives. Manually verify each finding
11. **Heuristic Score**: Header weighting (CSP=25, HSTS=15, etc.) is a design decision, not a universal standard
12. **Only Public URLs**: SSRF protection automatically blocks access to private IPs, localhost, and internal networks. Only publicly accessible URLs from Internet can be scanned. This includes blocking ranges `10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `169.254.x` (cloud metadata), and loopback IPv6
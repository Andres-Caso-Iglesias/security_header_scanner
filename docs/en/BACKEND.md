# Backend: Security Header Scanner & Quick Assessment Tool

> **ACADEMIC PROJECT** — This tool was developed as a Master's project in Cybersecurity.
> Results are indicative. Do not use as the sole instrument for professional auditing.

Detailed technical documentation of the NestJS backend.

## Table of Contents

- [Architecture](#architecture)
- [Modules](#modules)
  - [Common Module](#common-module)
  - [Scanner Module](#scanner-module)
  - [Analyzer Module](#analyzer-module)
  - [Compliance Module](#compliance-module)
  - [Report Module](#report-module)
- [Scoring System](#scoring-system)
- [Header Checkers](#header-checkers)
- [Compliance Mapping](#compliance-mapping)
- [Security](#security)
  - [API Key](#api-key)
  - [Rate Limiting](#rate-limiting)
  - [CORS](#cors)
  - [SSRF Protection](#ssrf-protection)
  - [Request Logging](#request-logging)
  - [Configurable Timeouts](#configurable-timeouts)
- [Error Handling](#error-handling)
- [Input Validation](#input-validation)
- [Testing](#testing)

## Architecture

The backend follows NestJS modular architecture with 6 independent functional modules. Each module encapsulates a domain responsibility and communicates with others through NestJS dependency injection. All services, checkers (15) and mappers (4) are registered as providers and injected via constructor — `new` is never used in production code.

```
HTTP Request (POST /api/scan)        HTTP Request (GET /api/scan/stream)
        |                                          |
        v                                          v
   ScannerController  -->  ValidationPipe     ScannerController (SSE)
        |                                          |
        v                                          v
   ScannerService.scan(url)                ScannerService.scanStream(url)
        |                                          |
        |                                    + scanCore(url)                 scanCore(url, onProgress)
        |                                          |
        |                                    | 
        |                                    +---> HttpClientService            HttpClientService
        |                                    +---> TlsCheckerService            TlsCheckerService
        |                                    +---> DnsCheckerService            DnsCheckerService
        |                                    +---> SecurityFileChecker          SecurityFileChecker
        |                                    +---> SensitiveFileChecker         SensitiveFileChecker
        |                                    +---> SriChecker                   SriChecker
        |                                    +---> TechFingerprinter            TechFingerprinter
        |                                    +---> CveApiService (OSV.dev)      CveApiService (OSV.dev)
        |                                          |
        v                                          v
   AnalyzerService  �"?�"?�"? ScoreCalculator     AnalyzerService  �"?�"?�"? ScoreCalculator
        |                                          |
        v                                          v
   ComplianceService                          ComplianceService
   (OWASP, NIS2, ENS, ISO 27001)             (OWASP, NIS2, ENS, ISO 27001)
        |                                          |
        v                                          v
   ReportService (JSON)                      HistoryService (SQLite auto-save)
```

   JSON Response                              SSE stream: events + final report

### Data Flow

1. The client sends `POST /api/scan` with `{ "url": "https://..." }`
2. `ValidationPipe` validates and transforms the body according to `ScanRequestDto`
3. `ScannerController` delegates to `ScannerService.scan(url)`
4. The URL is parsed to extract hostname, port and protocol
5. `HttpClientService` (HTTP fetch) and `TlsCheckerService` (TLS/SSL) run IN PARALLEL via `Promise.all`
6. `AnalyzerService` receives raw headers and passes them through the 15 checkers
7. `ScoreCalculator` calculates the weighted score (0-100) and assigns grade A-F
8. `TlsCheckerService` returns TLS certificate information (version, validity, issuer, SAN, etc.) and a TLS grade
9. `ComplianceService` maps findings (headers + TLS) to OWASP Top 10 and NIS2
10. `ReportService` generates the final JSON with score, headers, compliance, TLS and recommendations

## Modules

### Common Module

This is not a NestJS module but a shared folder with all types, interfaces and utilities used by other modules.

**`src/common/interfaces/header-checker.interface.ts`**
```typescript
interface HeaderChecker {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  weight: number;
  analyze(value: string | undefined): HeaderResult;
}
```

This interface is the contract that all checkers implement. The `analyze` method receives the header value (or `undefined` if not present) and returns a `HeaderResult` with the rating, finding and recommendation.

**Common files:**
- `config/cors.config.ts` - CORS configuration (restricted to `http://localhost:5173` by default, configurable via `CORS_ORIGIN`)
- `config/security.config.ts` - Security configuration (API Key, etc.)
- `interfaces/header-checker.interface.ts` - HeaderChecker interface + HeaderResult type
- `interfaces/scan-result.interface.ts` - ScanResult, ComplianceSection, ComplianceFinding, ScanMetadata types
- `enums/severity.enum.ts` - SEVERITY and SEVERITY_WEIGHTS constants (pattern `as const`)
- `constants/header-weights.ts` - Configuration of the 15 headers with name, severity, weight, expected value
- `constants/timeout.config.ts` - Configurable timeouts for 8 subsystems
- `filters/http-exception.filter.ts` - Global HTTP exception filter
- `pipes/url-validation.pipe.ts` - URL validation pipe with SSRF protection
- `guards/ssrf.guard.ts` - SSRF protection utilities (isPrivateIp, isBlockedHostname, resolveAndCheckHostname)

### Scanner Module

Module responsible for the HTTP presentation layer and scan orchestration.

**`src/scanner/scanner.controller.ts`**
- Endpoint: `POST /api/scan`
- Decorated with `@HttpCode(HttpStatus.OK)` (200, not 201)
- Swagger: `@ApiTags`, `@ApiOperation`, `@ApiResponse` for each status code
- Validation: `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`

**`src/scanner/dto/scan-request.dto.ts`**
```typescript
class ScanRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;
}
```

**`src/scanner/http-client/http-client.service.ts`**

HTTP client based on Axios via `@nestjs/axios`. Handles the following network errors:

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Timeout (ECONNABORTED) | 504 | Request timed out |
| DNS (ENOTFOUND, EAI_AGAIN) | 502 | Could not resolve hostname |
| Connection refused (ECONNREFUSED) | 502 | Connection refused |
| Connection reset (ECONNRESET) | 502 | Connection was reset |
| Invalid SSL certificate | 502 | SSL certificate error |
| Other Axios errors | 502 | Fetch Error |

Configuration: timeout 10s, max 5 redirects, `validateStatus: () => true` (accepts any status code), `responseType: arraybuffer` (does not download body).

**`src/scanner/scanner.service.ts`**

Orchestrator of the complete flow. Implements the **Template Method** pattern to eliminate duplication between normal scan and streaming:

```
scan() �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"
                           �"o�"?�"?�+' scanCore() �"?�"?�+' checks �+' report
scanStream(url) �"?�"?�"?      �",
                   �"o�"?�"?�+' scanCore(url, emit) �"?�"?�+' checks + events �+' report
                   �",
            (Subject �+' Observable)
```

- `scanCore(url, onProgress?)`: private method with ALL the central logic. Receives an optional `onProgress` callback that emits progress events by stage. If not provided, emits are no-ops.
- `scan(url)`: calls `scanCore()` without callback and persists the report in SQLite history
- `scanStream(url)`: calls `scanCore()` with a callback that emits events to a `Subject`, returning an `Observable` for SSE

**Progress stages emitted by `scanStream()`:**

| Stage | Description |
|-------|-------------|
| `http` | Initial HTTP request (response headers) |
| `tls` | TLS/SSL connection verification |
| `dns` | DNS record query (SPF, DKIM, DMARC) |
| `security-files` | Security files (robots.txt, security.txt) |
| `sensitive-files` | Sensitive paths scan (40 paths) |
| `sri` | Subresource Integrity (SRI) analysis |
| `fingerprint` | Technology identification + OSV.dev query |
| `analysis` | Score and compliance calculation |
| `complete` | Scan finished, report ready |

### TechFingerprinterService

Service that identifies server, CMS, framework and runtime technologies, and contrasts them with CVEs via OSV.dev query + local backup database.

**Location:** `src/scanner/fingerprint/tech-fingerprinter.service.ts`

**Detection signatures (23 technologies):**

| Technology | Category | Detection Method |
|------------|----------|------------------|
| WordPress | CMS | Meta generator, wp-content paths, wp-json REST API |
| Joomla | CMS | Meta generator, component/module paths |
| Drupal | CMS | Meta generator, sites/default paths |
| Vite | CMS | `<script type="module" src="/@vite/...">` |
| Next.js | CMS | `__NEXT_DATA__`, headers `x-nextjs-*` |
| Nuxt.js | CMS | `__NUXT__` script |
| PHP | Runtime | X-Powered-By header |
| Express | Framework | X-Powered-By header |
| ASP.NET | Framework | X-AspNet-Version header, cookies |
| Laravel | Framework | X-Powered-By header |
| Django | Framework | X-Powered-By, WSGI server |
| Ruby on Rails | Framework | X-Rack-Cache, X-Runtime, `_session_id` cookie |
| Nginx | Server | Server header |
| Apache | Server | Server header |
| Tomcat | Server | `Server: Apache-Coyote` |
| IIS | Server | Server header + X-AspNet-Version |
| Gunicorn | Server | `Server: gunicorn` |
| Cloudflare | CDN | cf-ray, cf-cache-status headers |
| Node.js | Runtime | `connect.sid` cookie, X-Powered-By Express |
| Python | Runtime | `Server: Python/` |
| jQuery | Library | Script src references in HTML |
| Bootstrap | Framework | Stylesheet references in HTML |
| Google Analytics | CMS | Analytics script |

**Flow:**
1. Takes HTTP headers already obtained by HttpClientService
2. Fetches HTML from the URL (best-effort, tolerates failures)
3. Executes the 23 detection signatures
4. Deduplicates technologies by name (prioritizes higher confidence)
5. Contrasts detected versions against local 20 CVE database
6. Queries OSV.dev API for each technology with detected version
7. Merges results (local + OSV), deduplicating by CVE ID
8. Calculates grade: 1.0 if no CVEs, 0.2 if critical CVEs, 0.4 if high, 0.6 if medium

### CveApiService

Service that queries the public OSV.dev API (Google Open Source Vulnerabilities) to obtain updated CVEs.

**Location:** `src/scanner/fingerprint/cve-api.service.ts`

**Endpoint:** `POST https://api.osv.dev/v1/query`

**Request:**
```json
{ "package": { "name": "nginx" }, "version": "1.24.0" }
```

**Features:**
- In-memory cache with 30 minute TTL to avoid rate limiting
- Silent fallback: if API doesn't respond, continues only with local base
- Technology name mapping to OSV names (e.g: "Nginx" �+' "nginx", "WordPress" �+' "wordpress")
- Severity extraction from CVSS score or database_specific
- Deduplication by CVE ID (prioritizes CVE alias over USN/GHSA IDs)

## Security

### API Key

**Location:** `src/common/guards/api-key.guard.ts`

The `ApiKeyGuard` protects all endpoints of `ScannerController`. It verifies the `X-API-Key` header in each request.

- Configurable via environment variable `API_KEY`
- If `API_KEY` is empty (default), authentication is disabled
- If configured, requests without the correct header receive `401 Unauthorized`

```typescript
// Usage with API Key
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave" \
  -d '{"url":"https://example.com"}'
```

### Rate Limiting

**Configuration:** `src/app.module.ts` via `@nestjs/throttler`

| Parameter | Default | Environment Variable |
|-----------|---------|---------------------|
| Max requests | 20 | `RATE_LIMIT_MAX` |
| Window | 60000ms (1 min) | `RATE_LIMIT_WINDOW_MS` |

Applies to endpoints `POST /api/scan` and `POST /api/export`. Requests exceeding the limit receive `429 Too Many Requests`.

### CORS

**Location:** `src/common/config/cors.config.ts`

CORS configuration is centralized in a single file and applied in `main.ts` when creating the application:

```typescript
const app = await NestFactory.create(AppModule, { cors: CORS_CONFIG });
```

| Parameter | Default | Environment Variable |
|-----------|---------|---------------------|
| Allowed origin | `http://localhost:5173` | `CORS_ORIGIN` |
| Methods | GET, POST, DELETE | �?" |
| Credentials | true | �?" |

By default only allows connections from the frontend development (Vite on port 5173). For production environments with other origins, configure `CORS_ORIGIN` with the frontend URL or `*` to open to all (not recommended).

### SSRF Protection

**Location:** `src/common/guards/ssrf.guard.ts` and `src/common/pipes/url-validation.pipe.ts`

Protection against **Server-Side Request Forgery (SSRF)** is implemented in two defense-in-depth layers:

#### Layer 1: Static Validation (UrlValidationPipe)

Executed at the API entry point (controller) and rejects URLs pointing to:

| Category | Blocked Examples |
|----------|------------------|
| IPv4 private | `10.0.0.1`, `172.16.0.1`, `192.168.1.1` |
| Loopback | `127.0.0.1`, `127.0.0.255` |
| Link-local (cloud metadata) | `169.254.169.254` (AWS/GCP/Azure metadata) |
| IPv6 loopback | `::1`, `[::1]`, `::` |
| Reserved hostnames | `localhost`, `localhost.localdomain`, `0.0.0.0` |

#### Layer 2: Dynamic DNS Resolution (before each request)

Before any service performs an HTTP request or TLS connection, the hostname is resolved and it is verified that **none** of the returned IPs are private. This mitigates **DNS rebinding** attacks, where a domain first points to a public IP and then changes to a private IP.

> **TOCTOU Note:** There is a theoretical window between DNS resolution and actual connection where an attacker with DNS control could change the IP. For an academic project this protection is sufficient. For production a custom DNS resolver or network-level controls are recommended.

**Protected Services:**
- `HttpClientService` �?" main HTTP request
- `TlsCheckerService` �?" TLS/SSL connection
- `SecurityFileCheckerService` �?" robots.txt, security.txt
- `SensitiveFileCheckerService` �?" scan of 40 sensitive paths
- `SriCheckerService` �?" resource integrity analysis
- `TechFingerprinterService` �?" technology detection (best-effort)

**SSRF Guard Functions:**
```typescript
// Checks if an IP is private (IPv4 and IPv6)
isPrivateIp(ip: string): boolean

// Checks if a hostname is in the blocked list
isBlockedHostname(hostname: string): boolean

// Resolves DNS and rejects if any IP is private
async resolveAndCheckHostname(hostname: string): Promise<string>
```

**Blocked IP Ranges:**
| Range | Description |
|-------|-------------|
| `10.0.0.0/8` | Private Class A network |
| `172.16.0.0/12` | Private Class B network |
| `192.168.0.0/16` | Private Class C network |
| `127.0.0.0/8` | Loopback |
| `169.254.0.0/16` | Link-local (cloud metadata) |
| `0.0.0.0/8` | Unspecified network |
| `::1` | IPv6 loopback |
| `fc00::/7` | IPv6 unique local |
| `fe80::/10` | IPv6 link-local |

### Request Logging

**Location:** `src/common/middleware/request-logger.middleware.ts`

Middleware that logs each incoming HTTP request:

```
HTTP POST /api/scan 200 8432ms - ::1
HTTP GET /api/scan/stream 200 7541ms - 192.168.1.5
```

Format: `[method] [route] [status] [duration]ms - [ip]`

### Configurable Timeouts

**Location:** `src/common/constants/timeout.config.ts`

All system timeouts are centralized in a single file and configurable via environment variables:

| Subsystem | Default | Environment Variable |
|-----------|---------|---------------------|
| HTTP Client global | 10s | `TIMEOUT_HTTP_CLIENT` |
| Page fetch (HTML) | 8s | `TIMEOUT_PAGE_FETCH` |
| TLS/SSL socket | 8s | `TIMEOUT_TLS` |
| DNS queries | 5s | `TIMEOUT_DNS` |
| Security files | 5s | `TIMEOUT_SECURITY_FILE` |
| Sensitive files | 4s | `TIMEOUT_SENSITIVE_FILE` |
| SRI HTML fetch | 10s | `TIMEOUT_SRI` |
| OSV.dev CVE API | 8s | `TIMEOUT_CVE_API` |

## Error Handling

### Global Exception Filter (`AllExceptionsFilter`)

Catches all unhandled exceptions and returns a consistent JSON:

```json
{
  "statusCode": 400,
  "message": "URL must be a fully qualified domain name",
  "error": "Bad Request",
  "timestamp": "2026-05-11T20:00:00.000Z",
  "path": "/api/scan"
}
```

### HTTP Errors from Scanner

| Situation | Status | Message |
|-----------|--------|---------|
| Invalid URL | 400 | ValidationPipe message |
| Empty URL | 400 | URL is required |
| Non-HTHTTP protocol | 400 | Only HTTP and HTTPS URLs are allowed |
| SSRF - Private IP | 400 | Access to private IP address {ip} is not allowed |
| SSRF - Blocked hostname | 400 | Access to {hostname} is not allowed |
| SSRF - DNS rebinding | 403 | DNS resolution for {hostname} returned private IP {ip}. Access blocked to prevent SSRF. |
| Timeout | 504 | Request to {url} timed out |
| DNS failure | 502 | Could not resolve hostname for {url} |
| Connection refused | 502 | Connection refused by {url} |
| Connection reset | 502 | Connection was reset by {url} |
| SSL error | 502 | SSL certificate error for {url} |

## Input Validation

### URL Validation Pipe (`UrlValidationPipe`)

- Rejects empty URLs
- Limits maximum length to 2048 characters
- Only allows `http:` and `https:` protocols
- Verifies that hostname is an FQDN (contains at least one dot)
- **SSRF Protection**: blocks private IPs (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, 0.x), localhost, and IPv6 loopback variants

### DTO Validation (`ScanRequestDto`)

- `@IsString()`: must be string
- `@IsNotEmpty()`: not empty
- `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })`: valid URL with explicit protocol
- `whitelist: true`: removes undeclared fields from DTO
- `forbidNonWhitelisted: true`: rejects requests with extra fields

## Testing

### Unit Tests (33 suites)

Unit tests cover:
- Each checker individually (15 test files) �?" all with `@Injectable()`
- Score calculator with header combinations
- Compliance mappers (OWASP, NIS2) �?" all with `@Injectable()`
- ScannerService with mocked dependencies (includes 19 DI providers)
- ScannerService.scanStream with Subject mocking
- HttpClientService (timeouts, DNS errors, SSL errors)
- TlsCheckerService (direct grade calculation, SSRF bypassed in tests)
- DnsCheckerService (SPF, DKIM, DMARC, timeouts, no records)
- TechFingerprinterService (23 detection signatures)
- CveApiService (OSV.dev cache, fallback, error handling)
- ExportService (PDF generation, JSON export)
- HistoryService (save, findAll, findOne, delete, ping)
- SensitiveFileCheckerService (40 paths, soft 404 detection)
- SecurityFileCheckerService (robots.txt, security.txt)
- SriCheckerService (integrity attribute parsing)
- ApiKeyGuard (valid key, missing key, disabled auth)
- AllExceptionsFilter (HTTP exception, unknown exception)
- **SsrfGuard** (isPrivateIp IPv4/IPv6, isBlockedHostname, resolveAndCheckHostname, DNS rebinding)
- **UrlValidationPipe** (SSRF protection: private IPs, localhost, link-local, IPv6 loopback)

Test pattern for checkers:
```typescript
describe('CspChecker', () => {
  let checker: CspChecker;

  beforeEach(() => {
    checker = new CspChecker();
  });

  it('should return grade 0 when CSP header is missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for a restrictive CSP policy', () => {
    const result = checker.analyze("default-src 'self'; script-src 'self'; object-src 'none'");
    expect(result.grade).toBe(1.0);
  });
});
```

### E2E Tests (5 tests)

Test the complete flow via HTTP:
- Input validation (invalid URL, empty, unsupported protocol, extra fields)
- Network error handling (unreachable URL �+' 502)

### Execution

```bash
# Unit tests
npm test
npm run test:cov

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```
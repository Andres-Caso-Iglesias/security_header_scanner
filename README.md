# Security Header Scanner & Quick Assessment Tool v2.2

**Language:** [Español](./docs/es/README.md) | [English](./README.md)

> **ACADEMIC PROJECT — WARNING**
>
> This tool was developed as a **Cybersecurity Master's project** for educational and research purposes.
> **It should NOT be used as the sole instrument for professional security audits.**
> Results are indicative and may contain false positives or incomplete measurements.
> Please read the [known limitations](#known-limitations) before using this tool.

Passive web security analysis tool that examines HTTP response headers from public URLs, generates a security score (0-100), identifies misconfigurations, and maps results against normative frameworks (OWASP Top 10, NIS2, ENS, ISO 27001).

## Table of Contents

- [General Description](#general-description)
- [Technology Stack](#technology-stack)
- [Known Limitations](#known-limitations)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
  - [With Docker](#with-docker)
  - [Without Docker (local development)](#without-docker-local-development)
  - [With API Key](#with-api-key)
- [Environment Variables](#environment-variables)
- [API Security](#api-security)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Testing](#testing)
- [Analyzed Headers](#analyzed-headers)
- [License](#license)

## General Description

The tool receives a URL via REST API, performs an HTTP request to the same, extracts response headers, and analyzes them against 15 security parameters from the OWASP Secure Headers Project. Each header receives a rating (0.0-1.0) based on its presence and configuration. The total rating is weighted by severity to obtain a 0-100 score with A-F grade.

### What it actually does?

| Component | What it measures? | What it does NOT measure? |
|-----------|-------------------|---------------------------|
| **HTTP Headers** | Presence, value and configuration of 15 headers | XSS, SQLi vulnerabilities in content |
| **TLS/SSL** | Protocol version, certificate data | Cipher configuration, TLS vulnerabilities |
| **DNS** | SPF, DKIM, DMARC records | DNS server security, DNSSEC |
| **Sensitive Files** | 40 common paths with soft 404 detection | Actual file content |
| **Fingerprinting** | 23 detectable technologies | Exact unverified versions |
| **CVEs** | Local base (20) + OSV.dev real-time | Vulnerabilities not covered by OSV |
| **Compliance** | Automatic mapping based on headers | Real compliance audit |

### Appropriate Use Cases

- ✅ Academic training in cybersecurity
- ✅ Demonstration of web security concepts
- ✅ Quick and informal HTTP header verification
- ✅ Personal projects and experimentation

### INAPPROPRIATE Use Cases

- ❌ Professional or contractual security audits
- ❌ Decision making without manual verification
- ❌ Formal compliance norm evaluation
- ❌ Sole tool in a pentesting process

## Technology Stack

### Backend

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| HTTP Client | Axios (via @nestjs/axios 4) |
| Validation | class-validator + class-transformer |
| Rate Limiting | @nestjs/throttler (20 req/min per IP) |
| Authentication | API Key via header `X-API-Key` |
| CORS | Restricted to `http://localhost:5173` (configurable via `CORS_ORIGIN`) |
| SSRF Protection | Private IP blocking + DNS resolution before each request + hostname validation |
| Security Headers | Helmet configured with HSTS, X-Content-Type-Options, X-Frame-Options, etc. |
| Logging | HTTP middleware with duration and origin |
| API Documentation | Swagger / OpenAPI (via @nestjs/swagger) |
| Testing | Jest + supertest (33 suites) |
| Export PDF | PDFKit |
| History | SQLite via better-sqlite3 (CRUD endpoints + health check) |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Bundler | Vite 8 |
| Styles | Tailwind CSS 4 |
| Charts | Chart.js 4 |
| Testing | Vitest + React Testing Library (8 files) |
| Language | TypeScript 6 |
| State Management | Custom hooks (`useScan`, `useTabs`) |
| Progress | Real-time via SSE (EventSource) |

### DevOps

| Component | Technology |
|-----------|------------|
| Containers | Docker + Docker Compose |
| Frontend Proxy | Nginx (with SSE support) |
| Local Script | `start.sh` |

## Known Limitations

### 1. Academic Nature

This tool was developed as a final Master's project in Cybersecurity. It has not undergone code audit, third-party security review, or any type of certification.

### 2. Partial Compliance Coverage

The mapping to OWASP Top 10, NIS2, ENS and ISO 27001 is **automatic and based exclusively on HTTP headers**. These frameworks are much broader and include organizational, process and technical requirements that cannot be verified solely with headers. **The compliance report is indicative, not conclusive.**

### 3. CVE Database

CVE detection combines:
- **Local base**: 20 hardcoded CVEs as offline backup
- **OSV.dev API**: real-time query to Google's Open Source Vulnerabilities database

The OSV.dev API query depends on Internet connectivity. If the API does not respond (timeout, network error), only the local base is used. **The absence of detected CVEs does not imply the site is vulnerability-free.**

### 4. Numerical Heuristic Score

The 0-100 score is based on design-assigned weights (CSP=25, HSTS=15, etc.). There is no universal standard for weighting security headers. The score is a **useful visual guide, not a security certification.**

### 5. False Positives in Sensitive Files

The sensitive file scan includes soft 404 detection (analyzes Content-Type and Content-Length). However, it may report false positives. Manually verify each finding before taking action.

### 6. No Authentication or Sessions

The tool does not support scanning behind login, authentication forms, or sites requiring sessions. It only analyzes public URLs accessible without credentials.

### 7. Network Dependency

Results depend on connectivity with the target server, firewalls, WAFs, CDNs, DNS resolution, and network latency.

## Requirements

- Node.js >= 18 (without Docker)
- npm >= 9 (without Docker)
- Docker + Docker Compose (with Docker)
- Internet connection (to scan external URLs)

## Quick Start

### With Docker

```bash
# Clone and run
cd security-header-scanner
docker compose up -d

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
# Swagger:  http://localhost:3000/api/docs

# To stop
docker compose down

# View logs
docker compose logs -f
```

### Without Docker (local development)

```bash
# Use automatic script
./start.sh

# Or manually:
# 1. Backend
npm install
npm run build
node dist/main.js              # Port 3000

# 2. Frontend (another terminal)
cd frontend
npm install
npm run dev                    # Port 5173
```

### With API Key

If an API Key is configured, all requests to `/api/*` must include the header:

```bash
# Docker
API_KEY=mi-clave-secreta docker compose up -d

# Without Docker
API_KEY=mi-clave-secreta node dist/main.js

# Usage
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{"url":"https://example.com"}'
```

## Environment Variables

All environment variables are validated at startup with **Zod** (`src/common/config/env.schema.ts`). If any variable has an invalid value, the application stops with a descriptive error message.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Internal backend port |
| `BACKEND_PORT` | `3000` | Backend exposed port (Docker/start.sh) |
| `FRONTEND_PORT` | `5173` | Frontend exposed port (Docker/start.sh) |
| `API_KEY` | `""` | Authentication key (empty = disabled) |
| `RATE_LIMIT_MAX` | `20` | Maximum requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limiting window in ms |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for CORS |
| `DB_PATH` | `data/scans.db` | SQLite database path |
| `TIMEOUT_HTTP_CLIENT` | `10000` | HTTP client timeout |
| `TIMEOUT_PAGE_FETCH` | `8000` | Page fetch timeout |
| `TIMEOUT_TLS` | `8000` | TLS verification timeout |
| `TIMEOUT_DNS` | `5000` | DNS resolution timeout |
| `TIMEOUT_SECURITY_FILE` | `5000` | Security files timeout |
| `TIMEOUT_SENSITIVE_FILE` | `4000` | Sensitive files timeout |
| `TIMEOUT_SRI` | `10000` | SRI verification timeout |
| `TIMEOUT_CVE_API` | `8000` | CVE API timeout |

## API Security

| Protection | Description | Configuration |
|------------|-------------|---------------|
| **API Key** | `X-API-Key` header required in all endpoints | `API_KEY` env var. Empty = disabled |
| **Rate Limiting** | Maximum 20 requests per minute per IP | `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` env vars |
| **CORS** | Restricted to `http://localhost:5173` by default | `CORS_ORIGIN` env var. `*` to open to all |
| **Helmet** | Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.) | Automatic. Configured in `main.ts` |
| **SSRF Protection** | Private IP blocking (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x) + DNS resolution before each request | Automatic. No configuration |
| **Logging** | Each request logged with method, route, status, duration and IP | Automatic. No configuration |

## API Endpoints

### Health Check

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Service health status. Includes uptime, memory usage and SQLite database connectivity. |

**Example response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T12:00:00.000Z",
  "uptime": 123.45,
  "memory": { "rss": 123456789, "heapTotal": 45678901, "heapUsed": 34567890, "external": 1234567, "arrayBuffers": 123456 },
  "database": {
    "status": "connected",
    "path": "data/scans.db"
  }
}
```

If the database does not respond, `status` will be `"degraded"` and `database.status` will be `"disconnected"`.

## Project Structure

```
security-header-scanner/
├── src/                          # Backend NestJS
│   ├── main.ts                   # Bootstrap + Swagger + Helmet + API Key scheme
│   ├── app.module.ts             # Root module + ThrottlerModule + RequestLogger
│   ├── common/
│   │   ├── config/               # Security, timeouts, CORS, env validation (Zod)
│   │   ├── guards/               # ApiKeyGuard, SsrfGuard (SSRF protection)
│   │   ├── middleware/           # RequestLoggerMiddleware
│   │   ├── interfaces/           # Shared types
│   │   ├── constants/            # Timeout.config, header-weights
│   │   ├── filters/              # Global exception filter
│   │   └── pipes/                # URL validation with SSRF
│   ├── scanner/                  # Controller, DTOs, HTTP client, TLS, DNS, files, SRI, fingerprint
│   │   ├── fingerprint/          # Tech detection (23 signatures) + CveApiService (OSV.dev)
│   │   └── dto/                  # ScanProgressEvent (SSE streaming)
│   ├── history/                  # SQLite CRUD via better-sqlite3 + ping()
│   ├── analyzer/                 # Score calculator + 15 header checkers (DI)
│   ├── compliance/               # OWASP, NIS2, ENS, ISO 27001 mappers (DI)
│   ├── report/                   # Export PDF/JSON
│   └── health/                   # Health endpoint with SQLite check
├── test/                         # Unit tests (33 suites) and e2e
├── frontend/                     # React 19 + Vite 8 + Tailwind 4
│   └── src/
│       ├── hooks/                # useScan.ts, useTabs.ts
│       ├── components/           # Organized by feature:
│       │   ├── layout/           # ErrorBoundary
│       │   ├── scan/             # ScanForm, ScanProgress
│       │   └── results/          # 12 components + barrel export
│       ├── lib/cn.ts             # Tailwind utility
│       ├── types.ts              # Interfaces (MIRROR + FRONTEND-ONLY)
│       └── test/                 # Tests with Vitest + RTL
├── shared/                       # Shared types (optional)
├── Dockerfile                    # Backend multi-stage
├── docker-compose.yml            # Backend + Frontend + network
├── start.sh                      # Local development script
├── .env.example                  # Documented environment variables
└── docs/                         # Detailed documentation
```

## Documentation

- [docs/BACKEND.md](docs/en/BACKEND.md): Backend architecture, modules, checkers, scoring, API, security
- [docs/FRONTEND.md](docs/en/FRONTEND.md): Frontend React + Vite + Tailwind, components, testing
- [docs/GUIA_USO.md](docs/en/GUIA_USO.md): Usage guide and results interpretation

## CI/CD

The project includes a GitHub Actions pipeline in `.github/workflows/ci.yml` that runs on **push to `main`** and **Pull Requests**:

| Job | Steps |
|-----|-------|
| **Backend** (NestJS) | `npm ci` → `npm run build` → `npm test` |
| **Frontend** (React) | `npm ci` → `tsc -b --noEmit` → `npm run build` → `npm test` |

Both jobs run in **parallel** on Ubuntu Latest + Node.js 22 with `node_modules` caching.

## Testing

```bash
# Backend (33 suites)
npm test
npm run test:cov

# Frontend (8 files)
cd frontend
npm test
```

## Analyzed Headers

| Header | Severity | Weight |
|--------|----------|--------|
| Content-Security-Policy | critical | 25 |
| Strict-Transport-Security | high | 15 |
| X-Frame-Options | high | 15 |
| X-Content-Type-Options | medium | 10 |
| Referrer-Policy | medium | 10 |
| Permissions-Policy | medium | 10 |
| Cache-Control | medium | 10 |
| Access-Control-Allow-Origin | high | 15 |
| Set-Cookie | high | 15 |
| Cross-Origin-Resource-Policy | medium | 10 |
| Cross-Origin-Opener-Policy | medium | 10 |
| Cross-Origin-Embedder-Policy | low | 5 |
| X-Powered-By | low | 5 |
| Server | low | 5 |
| X-XSS-Protection | low | 5 |

## License

Academic project — Cybersecurity Master's — Andrés Caso Iglesias
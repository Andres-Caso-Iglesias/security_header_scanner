# Auditoría de Seguridad Web v2.1

> **PROYECTO ACADÉMICO — ADVERTENCIA**
>
> Esta herramienta fue desarrollada como **proyecto de Máster en Ciberseguridad** con fines educativos y de investigación.
> **NO debe utilizarse como único instrumento para auditorías de seguridad profesionales.**
> Los resultados son orientativos y pueden contener falsos positivos o mediciones incompletas.
> Lee las [limitaciones conocidas](#limitaciones-conocidas) antes de usar esta herramienta.

Herramienta de análisis pasivo de seguridad web que examina los headers HTTP de respuesta de URLs públicas, genera un puntaje de seguridad (0-100), identifica configuraciones deficientes, y mapea los resultados contra frameworks normativos (OWASP Top 10, NIS2, ENS, ISO 27001).

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Limitaciones Conocidas](#limitaciones-conocidas)
- [Requerimientos](#requerimientos)
- [Inicio Rápido](#inicio-rápido)
  - [Con Docker](#con-docker)
  - [Sin Docker (desarrollo local)](#sin-docker-desarrollo-local)
  - [Con API Key](#con-api-key)
- [Variables de Entorno](#variables-de-entorno)
- [Seguridad de la API](#seguridad-de-la-api)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Testing](#testing)
- [Headers Analizados](#headers-analizados)
- [Licencia](#licencia)

## Descripción General

La herramienta recibe una URL vía API REST, realiza una petición HTTP a la misma, extrae los headers de respuesta y los analiza contra 15 parámetros de seguridad del OWASP Secure Headers Project. Cada header recibe una calificación (0.0-1.0) según su presencia y configuración. La calificación total se pondera por severidad para obtener un score 0-100 con grado A-F.

**¿Qué hace realmente?**

| Componente | ¿Qué mide? | ¿Qué NO mide? |
|-----------|-----------|--------------|
| **Headers HTTP** | Presencia, valor y configuración de 15 headers | Vulnerabilidades XSS, SQLi en el contenido |
| **TLS/SSL** | Versión del protocolo, datos del certificado | Configuración de cifrado, vulnerabilidades TLS |
| **DNS** | Registros SPF, DKIM, DMARC | Seguridad del servidor DNS, DNSSEC |
| **Archivos sensibles** | 40 rutas comunes con detección de soft 404 | Contenido real de los archivos |
| **Fingerprinting** | 23 tecnologías detectables | Versiones exactas no verificadas |
| **CVEs** | Base local (20) + OSV.dev en tiempo real | Vulnerabilidades no cubiertas por OSV |
| **Compliance** | Mapeo automático basado en headers | Auditoría de compliance real |

### Casos de uso apropiados

- ✅ Formación académica en ciberseguridad
- ✅ Demostración de conceptos de seguridad web
- ✅ Verificación rápida e informal de headers HTTP
- ✅ Proyectos personales y experimentación

### Casos de uso INAPROPIADOS

- ❌ Auditorías de seguridad profesionales o contractuales
- ❌ Toma de decisiones sin verificación manual
- ❌ Evaluación de cumplimiento normativo formal
- ❌ Herramienta única en un proceso de pentesting

## Stack Tecnológico

### Backend

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Lenguaje | TypeScript 5 |
| HTTP Client | Axios (via @nestjs/axios 4) |
| Validación | class-validator + class-transformer |
| Rate Limiting | @nestjs/throttler (20 req/min por IP) |
| Autenticación | API Key via header `X-API-Key` |
| CORS | Restringido a `http://localhost:5173` (configurable via `CORS_ORIGIN`) |
| SSRF Protection | Bloqueo de IPs privadas + resolución DNS antes de cada request |
| Logging | Middleware HTTP con duración y origen |
| Documentación API | Swagger / OpenAPI (via @nestjs/swagger) |
| Testing | Jest + supertest (291 tests, 33 suites) |
| Export PDF | PDFKit |
| Historial | SQLite via better-sqlite3 (CRUD endpoints) |

### Frontend

| Componente | Tecnología |
|------------|------------|
| Framework | React 19 |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js 4 |
| Testing | Vitest + React Testing Library (44 tests, 8 archivos) |
| Lenguaje | TypeScript 6 |

### DevOps

| Componente | Tecnología |
|------------|------------|
| Contenedores | Docker + Docker Compose |
| Proxy Frontend | Nginx (con soporte SSE) |
| Script Local | `start.sh` |

## Limitaciones Conocidas

### 1. Naturaleza Académica

Esta herramienta fue desarrollada como proyecto de fin de Máster en Ciberseguridad. No ha sido sometida a auditoría de código, revisión de seguridad por terceros, ni certificación de ningún tipo.

### 2. Cobertura Parcial de Compliance

El mapeo a OWASP Top 10, NIS2, ENS e ISO 27001 es **automático y basado exclusivamente en headers HTTP**. Estos frameworks son mucho más amplios e incluyen requisitos organizativos, de procesos y técnicos que no pueden verificarse solo con headers. **El reporte de compliance es indicativo, no concluyente.**

### 3. Base de Datos de CVEs

La detección de CVEs combina:
- **Base local**: 20 CVEs hardcodeados como respaldo offline
- **API OSV.dev**: consulta en tiempo real a la base de datos de Open Source Vulnerabilities de Google

La consulta a OSV.dev depende de conectividad a Internet. Si la API no responde (timeout, error de red), se utiliza solo la base local. **La ausencia de CVEs detectados no implica que el sitio esté libre de vulnerabilidades.**

### 4. Score Numérico Heurístico

El score 0-100 se basa en pesos asignados por decisión de diseño (CSP=25, HSTS=15, etc.). No existe un estándar universal para ponderar headers de seguridad. El score es una **guía visual útil, no una certificación de seguridad**.

### 5. Falsos Positivos en Archivos Sensibles

El escaneo de archivos sensibles incluye detección de soft 404 (analiza Content-Type y Content-Length). Sin embargo, puede reportar falsos positivos. Verificar manualmente cada hallazgo antes de actuar.

### 6. Sin Autenticación ni Sesiones

La herramienta no soporta escaneo detrás de login, formularios de autenticación ni sitios que requieran sesión. Solo analiza URLs públicas accesibles sin credenciales.

### 7. Dependencia de Red

Los resultados dependen de la conectividad con el servidor destino, firewalls, WAFs, CDNs, resolución DNS, y latencia de red.

## Requerimientos

- Node.js >= 18 (sin Docker)
- npm >= 9 (sin Docker)
- Docker + Docker Compose (con Docker)
- Conexión a internet (para escanear URLs externas)

## Inicio Rápido

### Con Docker

```bash
# Clonar y levantar
cd auditoria-web
docker compose up -d

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
# Swagger:  http://localhost:3000/api/docs

# Para detener
docker compose down

# Ver logs
docker compose logs -f
```

### Sin Docker (desarrollo local)

```bash
# Usar script automático
./start.sh

# O manualmente:
# 1. Backend
npm install
npm run build
node dist/main.js              # Puerto 3000

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev                    # Puerto 5173
```

### Con API Key

Si se configura una API Key, todas las requests a `/api/*` deben incluir el header:

```bash
# Docker
API_KEY=mi-clave-secreta docker compose up -d

# Sin Docker
API_KEY=mi-clave-secreta node dist/main.js

# Uso
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{"url":"https://example.com"}'
```

## Variables de Entorno

Todas las variables de entorno se validan al inicio con **Zod** (`src/common/config/env.schema.ts`). Si alguna variable tiene un valor inválido, la aplicación se detiene con un mensaje de error descriptivo.

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto interno del backend |
| `BACKEND_PORT` | `3000` | Puerto expuesto del backend (Docker/start.sh) |
| `FRONTEND_PORT` | `5173` | Puerto expuesto del frontend (Docker/start.sh) |
| `API_KEY` | `""` | Clave de autenticación (vacío = deshabilitado) |
| `RATE_LIMIT_MAX` | `20` | Máximo de requests por ventana |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana de rate limiting en ms |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido para CORS |
| `DB_PATH` | `data/scans.db` | Ruta de la base de datos SQLite |
| `TIMEOUT_HTTP_CLIENT` | `10000` | Timeout para peticiones HTTP |
| `TIMEOUT_PAGE_FETCH` | `8000` | Timeout para fetch de páginas |
| `TIMEOUT_TLS` | `8000` | Timeout para verificación TLS |
| `TIMEOUT_DNS` | `5000` | Timeout para resolución DNS |
| `TIMEOUT_SECURITY_FILE` | `5000` | Timeout para archivos de seguridad |
| `TIMEOUT_SENSITIVE_FILE` | `4000` | Timeout para archivos sensibles |
| `TIMEOUT_SRI` | `10000` | Timeout para verificación SRI |
| `TIMEOUT_CVE_API` | `8000` | Timeout para API de CVEs |

## Seguridad de la API

| Protección | Descripción | Configuración |
|-----------|-------------|---------------|
| **API Key** | Header `X-API-Key` requerido en todos los endpoints | `API_KEY` env var. Vacío = deshabilitado |
| **Rate Limiting** | Máximo 20 requests por minuto por IP | `RATE_LIMIT_MAX` y `RATE_LIMIT_WINDOW_MS` env vars |
| **CORS** | Restringido a `http://localhost:5173` por defecto | `CORS_ORIGIN` env var. `*` para abrir a todos |
| **SSRF Protection** | Bloqueo de IPs privadas (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x) + resolución DNS antes de cada request | Automático. Sin configuración |
| **Logging** | Cada request se registra con método, ruta, status, duración e IP | Automático. Sin configuración |

## Endpoints de API

### Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado de salud del servicio. Incluye uptime, uso de memoria y conectividad de base de datos SQLite. |

**Respuesta ejemplo:**
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

Si la base de datos no responde, `status` será `"degraded"` y `database.status` será `"disconnected"`.

## Estructura del Proyecto

```
auditoria-web/
├── src/                          # Backend NestJS
│   ├── main.ts                   # Bootstrap + Swagger + API Key scheme
│   ├── app.module.ts             # Módulo raíz + ThrottlerModule + RequestLogger
│   ├── common/
│   │   ├── config/               # Seguridad, timeouts (via env vars)
│   │   ├── guards/               # ApiKeyGuard, SsrfGuard (protección SSRF)
│   │   ├── middleware/           # RequestLoggerMiddleware
│   │   ├── interfaces/           # Tipos compartidos
│   │   ├── constants/            # Timeout.config, header-weights
│   │   ├── filters/              # Global exception filter
│   │   └── pipes/                # URL validation
│   ├── scanner/                  # Controller, DTOs, HTTP client, TLS, DNS, files, SRI, fingerprint
│   │   ├── fingerprint/          # Tech detection (23 firmas) + CveApiService (OSV.dev)
│   │   └── dto/                  # ScanProgressEvent (SSE streaming)
│   ├── history/                  # SQLite CRUD via better-sqlite3
│   ├── analyzer/                 # Score calculator + 15 header checkers
│   ├── compliance/               # Mappers OWASP, NIS2, ENS, ISO 27001
│   └── report/                   # Export PDF/JSON
├── test/                         # Tests unitarios (291, 33 suites) y e2e
├── frontend/                     # React 19 + Vite 8 + Tailwind 4
│   └── src/
│       ├── components/           # 15 componentes (ScoreCircle, HeaderGrid, ScanProgress, ErrorBoundary, HistoryPanel...)
│       ├── lib/cn.ts             # Utilidad Tailwind
│       ├── types.ts              # Interfaces TypeScript
│       └── test/                 # 44 tests (8 archivos) con Vitest + RTL
├── Dockerfile                    # Backend multi-stage
├── docker-compose.yml            # Backend + Frontend + network
├── start.sh                      # Script desarrollo local
└── docs/                         # Documentación detallada
```

## Documentación

- [docs/BACKEND.md](docs/BACKEND.md): Arquitectura del backend, módulos, checkers, scoring, API, seguridad
- [docs/FRONTEND.md](docs/FRONTEND.md): Frontend React + Vite + Tailwind, componentes, testing
- [docs/GUIA_USO.md](docs/GUIA_USO.md): Guía de uso e interpretación de resultados

## CI/CD

El proyecto incluye un pipeline de GitHub Actions en `.github/workflows/ci.yml` que se ejecuta en **push a `main`** y en **Pull Requests**:

| Job | Pasos |
|-----|-------|
| **Backend** (NestJS) | `npm ci` → `npm run build` → `npm test` (291 tests) |
| **Frontend** (React) | `npm ci` → `tsc -b --noEmit` → `npm run build` → `npm test` (44 tests) |

Ambos jobs corren en **paralelo** con Ubuntu Latest + Node.js 22 y caching de `node_modules`.

## Testing

```bash
# Backend (291 tests, 33 suites)
npm test
npm run test:cov

# Frontend (44 tests, 8 archivos)
cd frontend
npm test
```

## Headers Analizados

| Header | Severidad | Peso |
|--------|-----------|------|
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

## Licencia

Proyecto académico — Máster en Ciberseguridad — Andrés Caso Iglesias

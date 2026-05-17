# Backend: Security Header Scanner & Quick Assessment Tool

> ⚠️ **PROYECTO ACADEMICO** — Esta herramienta fue desarrollada como proyecto de Master en Ciberseguridad.
> Los resultados son orientativos. No utilizar como unico instrumento de auditoria profesional.

Documentacion tecnica detallada del backend NestJS.

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Modulos](#modulos)
  - [Common Module](#common-module)
  - [Scanner Module](#scanner-module)
  - [Analyzer Module](#analyzer-module)
  - [Compliance Module](#compliance-module)
  - [Report Module](#report-module)
- [Sistema de Scoring](#sistema-de-scoring)
- [Header Checkers](#header-checkers)
- [Mapeo de Compliance](#mapeo-de-compliance)
- [Seguridad](#seguridad)
  - [API Key](#api-key)
  - [Rate Limiting](#rate-limiting)
  - [CORS](#cors)
  - [SSRF Protection](#ssrf-protection)
  - [Request Logging](#request-logging)
  - [Timeouts Configurables](#timeouts-configurables)
- [Manejo de Errores](#manejo-de-errores)
- [Validacion de Entrada](#validacion-de-entrada)
- [Testing](#testing)

## Arquitectura

El backend sigue la arquitectura modular de NestJS con 6 modulos funcionales independientes. Cada modulo encapsula una responsabilidad del dominio y se comunica con los demas a traves de la inyeccion de dependencias de NestJS. Todos los servicios, checkers (15) y mappers (4) estan registrados como providers y se inyectan via constructor — no se utiliza `new` en ningun punto del codigo de produccion.

```
HTTP Request (POST /api/scan)        HTTP Request (GET /api/scan/stream)
       |                                          |
       v                                          v
  ScannerController  -->  ValidationPipe     ScannerController (SSE)
       |                                          |
       v                                          v
  ScannerService.scan(url)                ScannerService.scanStream(url)
       |                                          |
       +---> scanCore(url)                 scanCore(url, onProgress)
       |                                          |
       |                                    + eventos SSE por etapa
       |                                    |
       +---> HttpClientService            HttpClientService
       +---> TlsCheckerService            TlsCheckerService
       +---> DnsCheckerService            DnsCheckerService
       +---> SecurityFileChecker          SecurityFileChecker
       +---> SensitiveFileChecker         SensitiveFileChecker
       +---> SriChecker                   SriChecker
       +---> TechFingerprinter            TechFingerprinter
       +---> CveApiService (OSV.dev)      CveApiService (OSV.dev)
       |                                          |
       v                                          v
  AnalyzerService  ─── ScoreCalculator     AnalyzerService  ─── ScoreCalculator
       |                                          |
       v                                          v
  ComplianceService                          ComplianceService
  (OWASP, NIS2, ENS, ISO 27001)             (OWASP, NIS2, ENS, ISO 27001)
       |                                          |
       v                                          v
  ReportService (JSON)                      HistoryService (SQLite auto-save)

  JSON Response                              SSE stream: eventos + reporte final
```

### Flujo de datos

1. El cliente envia `POST /api/scan` con `{ "url": "https://..." }`
2. `ValidationPipe` valida y transforma el body segun `ScanRequestDto`
3. `ScannerController` delega en `ScannerService.scan(url)`
4. Se parsea la URL para extraer hostname, puerto y protocolo
5. `HttpClientService` (fetch HTTP) y `TlsCheckerService` (TLS/SSL) se ejecutan EN PARALELO via `Promise.all`
6. `AnalyzerService` recibe los headers raw y los pasa por los 15 checkers
7. `ScoreCalculator` calcula el puntaje ponderado (0-100) y asigna grado A-F
8. `TlsCheckerService` devuelve informacion del certificado TLS (version, validez, emisor, SAN, etc.) y un grade TLS
9. `ComplianceService` mapea los hallazgos (headers + TLS) a OWASP Top 10 y NIS2
10. `ReportService` genera el JSON final con score, headers, compliance, tls y recomendaciones

## Modulos

### Common Module

No es un modulo NestJS sino una carpeta compartida con todos los tipos, interfaces y utilidades que usan los demas modulos.

**`src/common/interfaces/header-checker.interface.ts`**
```typescript
interface HeaderChecker {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  weight: number;
  analyze(value: string | undefined): HeaderResult;
}
```

Esta interfaz es el contrato que todos los checkers implementan. El metodo `analyze` recibe el valor del header (o `undefined` si no existe) y devuelve un `HeaderResult` con la calificacion, hallazgo y recomendacion.

**Archivos del common:**
- `config/cors.config.ts` - Configuracion CORS (restringido a `http://localhost:5173` por defecto, configurable via `CORS_ORIGIN`)
- `config/security.config.ts` - Configuracion de seguridad (API Key, etc.)
- `interfaces/header-checker.interface.ts` - Interface HeaderChecker + tipo HeaderResult
- `interfaces/scan-result.interface.ts` - Tipos ScanResult, ComplianceSection, ComplianceFinding, ScanMetadata
- `enums/severity.enum.ts` - Constantes SEVERITY y SEVERITY_WEIGHTS (pattern `as const`)
- `constants/header-weights.ts` - Configuracion de los 15 headers con nombre, severidad, peso, valor esperado
- `constants/timeout.config.ts` - Timeouts configurables para 8 subsistemas
- `filters/http-exception.filter.ts` - Filtro global de excepciones HTTP
- `pipes/url-validation.pipe.ts` - Pipe de validacion de URL con proteccion SSRF
- `guards/ssrf.guard.ts` - Utilidades de proteccion SSRF (isPrivateIp, isBlockedHostname, resolveAndCheckHostname)

### Scanner Module

Modulo responsable de la capa de presentacion HTTP y la orquestacion del scan.

**`src/scanner/scanner.controller.ts`**
- Endpoint: `POST /api/scan`
- Decorado con `@HttpCode(HttpStatus.OK)` (200, no 201)
- Swagger: `@ApiTags`, `@ApiOperation`, `@ApiResponse` para cada codigo de estado
- Validacion: `ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`

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

Cliente HTTP basado en Axios via `@nestjs/axios`. Maneja los siguientes errores de red:

| Error | Codigo HTTP | Mensaje |
|-------|-------------|---------|
| Timeout (ECONNABORTED) | 504 | Request timed out |
| DNS (ENOTFOUND, EAI_AGAIN) | 502 | Could not resolve hostname |
| Conexion rechazada (ECONNREFUSED) | 502 | Connection refused |
| Conexion reseteada (ECONNRESET) | 502 | Connection was reset |
| Certificado SSL invalido | 502 | SSL certificate error |
| Otros errores Axios | 502 | Fetch Error |

Configuracion: timeout 10s, max 5 redirects, `validateStatus: () => true` (acepta cualquier status code), `responseType: arraybuffer` (no descarga el body).

**`src/scanner/scanner.service.ts`**

Orquestador del flujo completo. Implementa el patrón **Template Method** para eliminar duplicación entre scan normal y streaming:

```
scan() ──────────────────┐
                          ├──→ scanCore() ──→ checks → report
scanStream(url) ──┐      │
                  ├──→ scanCore(url, emit) ──→ checks + events → report
                  │
           (Subject → Observable)
```

- `scanCore(url, onProgress?)`: método privado con TODA la lógica central. Recibe un callback opcional `onProgress` que emite eventos de progreso por etapa. Si no se provee, los emits son no-ops.
- `scan(url)`: llama a `scanCore()` sin callback y persiste el reporte en historial SQLite
- `scanStream(url)`: llama a `scanCore()` con un callback que emite eventos a un `Subject`, retornando un `Observable` para SSE

**Etapas de progreso emitidas por `scanStream()`:**

| Etapa | Descripción |
|-------|-------------|
| `http` | Solicitud HTTP inicial (headers de respuesta) |
| `tls` | Verificación de conexión TLS/SSL |
| `dns` | Consulta de registros DNS (SPF, DKIM, DMARC) |
| `security-files` | Archivos de seguridad (robots.txt, security.txt) |
| `sensitive-files` | Escaneo de rutas sensibles (40 rutas) |
| `sri` | Análisis de integridad de recursos (SRI) |
| `fingerprint` | Identificación de tecnologías + consulta OSV.dev |
| `analysis` | Cálculo de score y compliance |
| `complete` | Escaneo finalizado, reporte listo |

### TechFingerprinterService

Servicio de fingerprinting que identifica tecnologias del servidor, CMS, frameworks y runtimes, y las contrasta con CVEs mediante consulta a OSV.dev + base local de respaldo.

**Ubicacion:** `src/scanner/fingerprint/tech-fingerprinter.service.ts`

**Firmas de deteccion (23 tecnologias):**

| Tecnologia | Categoria | Metodo de deteccion |
|------------|-----------|---------------------|
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
| jQuery | Libreria | Script src references en HTML |
| Bootstrap | Framework | Stylesheet references en HTML |
| Google Analytics | CMS | Script de analytics |

**Flujo:**
1. Toma los headers HTTP ya obtenidos por el HttpClientService
2. Fetch del HTML de la URL (best-effort, tolera fallos)
3. Ejecuta las 23 firmas de deteccion
4. Desduplica tecnologias por nombre (prioriza mayor confianza)
5. Contrasta versiones detectadas contra la base de datos local de 20 CVEs
6. Consulta API de OSV.dev para cada tecnologia con version detectada
7. Fusiona resultados (locales + OSV), deduplicando por CVE ID
8. Calcula grade: 1.0 sin CVEs, 0.2 si hay CVEs critical, 0.4 si high, 0.6 si medium

### CveApiService

Servicio que consulta la API pública de OSV.dev (Google Open Source Vulnerabilities) para obtener CVEs actualizados.

**Ubicacion:** `src/scanner/fingerprint/cve-api.service.ts`

**Endpoint:** `POST https://api.osv.dev/v1/query`

**Request:**
```json
{ "package": { "name": "nginx" }, "version": "1.24.0" }
```

**Caracteristicas:**
### HistoryService

**Ubicacion:** `src/history/history.service.ts`

Servicio que persiste los resultados de escaneos en una base de datos SQLite via `better-sqlite3`.

**Tabla:** `scans` con los campos `id`, `url`, `score`, `grade`, `timestamp`, `data` (JSON blob del reporte completo).

**Endpoints expuestos via `HistoryController`:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/history` | Lista todos los escaneos (sin datos completos) |
| `GET` | `/api/history/:id` | Obtiene un escaneo completo por ID |
| `POST` | `/api/history` | Guarda un escaneo manualmente |
| `DELETE` | `/api/history/:id` | Elimina un escaneo |

**Auto-save:** Cada escaneo exitoso via `POST /api/scan` se persiste automaticamente en `ScannerService.scan()`. Los escaneos via `scanStream()` (SSE) NO se guardan automaticamente.

**Ubicacion de la base de datos:** `data/scans.db` (relativa a la raiz del proyecto).

- Cache en memoria con TTL de 30 minutos para evitar rate limiting
- Fallback silencioso: si la API no responde, continua solo con la base local
- Mapeo de nombres de tecnologia a nombres OSV (ej: "Nginx" → "nginx", "WordPress" → "wordpress")
- Extraccion de severidad desde CVSS score o database_specific
- Deduplicacion por CVE ID (prioriza alias CVE sobre IDs de USN/GHSA)

## Seguridad

### API Key

**Ubicacion:** `src/common/guards/api-key.guard.ts`

El `ApiKeyGuard` protege todos los endpoints del `ScannerController`. Verifica el header `X-API-Key` en cada request.

- Configurable via variable de entorno `API_KEY`
- Si `API_KEY` esta vacio (default), la autenticacion esta deshabilitada
- Si esta configurado, las requests sin el header correcto reciben `401 Unauthorized`

```typescript
// Uso con API Key
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave" \
  -d '{"url":"https://example.com"}'
```

### Rate Limiting

**Configuracion:** `src/app.module.ts` via `@nestjs/throttler`

| Parametro | Default | Variable de entorno |
|-----------|---------|-------------------|
| Max requests | 20 | `RATE_LIMIT_MAX` |
| Ventana | 60000ms (1 min) | `RATE_LIMIT_WINDOW_MS` |

Aplica a los endpoints `POST /api/scan` y `POST /api/export`. Las requests que exceden el limite reciben `429 Too Many Requests`.

### CORS

**Ubicacion:** `src/common/config/cors.config.ts`

La configuracion CORS se centraliza en un unico archivo y se aplica en `main.ts` al crear la aplicacion:

```typescript
const app = await NestFactory.create(AppModule, { cors: CORS_CONFIG });
```

| Parametro | Default | Variable de entorno |
|-----------|---------|-------------------|
| Origen permitido | `http://localhost:5173` | `CORS_ORIGIN` |
| Metodos | GET, POST, DELETE | — |
| Credentials | true | — |

Por defecto solo permite conexiones desde el frontend de desarrollo (Vite en puerto 5173). Para entornos de produccion con otros origenes, configurar `CORS_ORIGIN` con la URL del frontend o `*` para abrir a todos (no recomendado).

### SSRF Protection

**Ubicacion:** `src/common/guards/ssrf.guard.ts` y `src/common/pipes/url-validation.pipe.ts`

La proteccion contra **Server-Side Request Forgery (SSRF)** se implementa en dos capas de defensa en profundidad:

#### Capa 1: Validacion estatica (UrlValidationPipe)

Se ejecuta en el punto de entrada de la API (controller) y rechaza URLs que apunten a:

| Categoria | Ejemplos bloqueados |
|-----------|---------------------|
| IPv4 privadas | `10.0.0.1`, `172.16.0.1`, `192.168.1.1` |
| Loopback | `127.0.0.1`, `127.0.0.255` |
| Link-local (cloud metadata) | `169.254.169.254` (AWS/GCP/Azure metadata) |
| IPv6 loopback | `::1`, `[::1]`, `::` |
| Hostnames reservados | `localhost`, `localhost.localdomain`, `0.0.0.0` |

#### Capa 2: Resolucion DNS dinamica (antes de cada request)

Antes de que cualquier servicio realice una peticion HTTP o conexion TLS, se resuelve el hostname y se verifica que **ninguna** de las IPs devueltas sea privada. Esto mitiga ataques de **DNS rebinding**, donde un dominio apunta primero a una IP publica y luego cambia a una privada.

> **Nota TOCTOU:** Existe una ventana teorica entre la resolucion DNS y la conexion real donde un atacante con control de DNS podria cambiar la IP. Para un proyecto academico esta proteccion es suficiente. Para produccion se recomendaria un resolver DNS custom o controles a nivel de red.

**Servicios protegidos:**
- `HttpClientService` — peticion HTTP principal
- `TlsCheckerService` — conexion TLS/SSL
- `SecurityFileCheckerService` — robots.txt, security.txt
- `SensitiveFileCheckerService` — escaneo de 40 rutas sensibles
- `SriCheckerService` — analisis de integridad de recursos
- `TechFingerprinterService` — deteccion de tecnologias (best-effort)

**Funciones del SSRF guard:**

```typescript
// Verifica si una IP es privada (IPv4 e IPv6)
isPrivateIp(ip: string): boolean

// Verifica si un hostname esta en la lista de bloqueados
isBlockedHostname(hostname: string): boolean

// Resuelve DNS y rechaza si alguna IP es privada
async resolveAndCheckHostname(hostname: string): Promise<string>
```

**Rangos de IPs bloqueadas:**

| Rango | Descripcion |
|-------|-------------|
| `10.0.0.0/8` | Red privada clase A |
| `172.16.0.0/12` | Red privada clase B |
| `192.168.0.0/16` | Red privada clase C |
| `127.0.0.0/8` | Loopback |
| `169.254.0.0/16` | Link-local (metadata de cloud) |
| `0.0.0.0/8` | Red no especificada |
| `::1` | IPv6 loopback |
| `fc00::/7` | IPv6 unique local |
| `fe80::/10` | IPv6 link-local |

### Request Logging

**Ubicacion:** `src/common/middleware/request-logger.middleware.ts`

Middleware que registra cada request HTTP entrante:

```
HTTP POST /api/scan 200 8432ms - ::1
HTTP GET /api/scan/stream 200 7541ms - 192.168.1.5
```

Formato: `[metodo] [ruta] [status] [duracion]ms - [ip]`

### Timeouts Configurables

**Ubicacion:** `src/common/constants/timeout.config.ts`

Todos los timeouts del sistema se centralizan en un unico archivo y son configurables via variables de entorno:

| Subsistema | Default | Variable de entorno |
|-----------|---------|-------------------|
| HTTP Client global | 10s | `TIMEOUT_HTTP_CLIENT` |
| Page fetch (HTML) | 8s | `TIMEOUT_PAGE_FETCH` |
| TLS/SSL socket | 8s | `TIMEOUT_TLS` |
| DNS queries | 5s | `TIMEOUT_DNS` |
| Security files | 5s | `TIMEOUT_SECURITY_FILE` |
| Sensitive files | 4s | `TIMEOUT_SENSITIVE_FILE` |
| SRI HTML fetch | 10s | `TIMEOUT_SRI` |
| OSV.dev CVE API | 8s | `TIMEOUT_CVE_API` |

## Manejo de Errores

### Global Exception Filter (`AllExceptionsFilter`)

Captura todas las excepciones no manejadas y retorna un JSON consistente:

```json
{
  "statusCode": 400,
  "message": "URL must be a fully qualified domain name",
  "error": "Bad Request",
  "timestamp": "2026-05-11T20:00:00.000Z",
  "path": "/api/scan"
}
```

### Errores HTTP del Scanner

| Situacion | Status | Mensaje |
|-----------|--------|---------|
| URL invalida | 400 | Mensaje del ValidationPipe |
| URL vacia | 400 | URL is required |
| Protocolo no HTTP | 400 | Only HTTP and HTTPS URLs are allowed |
| SSRF - IP privada | 400 | Access to private IP address {ip} is not allowed |
| SSRF - hostname bloqueado | 400 | Access to {hostname} is not allowed |
| SSRF - DNS rebinding | 403 | DNS resolution for {hostname} returned private IP {ip}. Access blocked to prevent SSRF. |
| Timeout | 504 | Request to {url} timed out |
| DNS falla | 502 | Could not resolve hostname for {url} |
| Conexion rechazada | 502 | Connection refused by {url} |
| Conexion reseteada | 502 | Connection was reset by {url} |
| SSL error | 502 | SSL certificate error for {url} |

## Validacion de Entrada

### URL Validation Pipe (`UrlValidationPipe`)

- Rechaza URLs vacias
- Limita longitud maxima a 2048 caracteres
- Solo permite protocolos `http:` y `https:`
- Verifica que el hostname sea un FQDN (contenga al menos un punto)
- **Proteccion SSRF**: bloquea IPs privadas (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, 0.x), localhost, y variantes de loopback IPv6

### DTO Validation (`ScanRequestDto`)

- `@IsString()`: debe ser string
- `@IsNotEmpty()`: no vacio
- `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })`: URL valida con protocolo explicito
- `whitelist: true`: elimina campos no declarados en el DTO
- `forbidNonWhitelisted: true`: rechaza peticiones con campos extra

## Testing

### Tests Unitarios (33 suites)

Los tests unitarios cubren:
- Cada checker individualmente (15 archivos de test) — todos con `@Injectable()`
- Score calculator con combinaciones de headers
- Mappers de compliance (OWASP, NIS2) — todos con `@Injectable()`
- ScannerService con dependencias mockeadas (incluye 19 providers de DI)
- ScannerService.scanStream con Subject mocking
- HttpClientService (timeouts, DNS errors, SSL errors)
- TlsCheckerService (grade calculation directa, SSRF bypassed en tests)
- DnsCheckerService (SPF, DKIM, DMARC, timeouts, no records)
- TechFingerprinterService (23 firmas de deteccion)
- CveApiService (OSV.dev cache, fallback, error handling)
- ExportService (PDF generation, JSON export)
- HistoryService (save, findAll, findOne, delete, ping)
- SensitiveFileCheckerService (40 rutas, soft 404 detection)
- SecurityFileCheckerService (robots.txt, security.txt)
- SriCheckerService (integrity attribute parsing)
- ApiKeyGuard (valid key, missing key, disabled auth)
- AllExceptionsFilter (HTTP exception, unknown exception)
- **SsrfGuard** (isPrivateIp IPv4/IPv6, isBlockedHostname, resolveAndCheckHostname, DNS rebinding)
- **UrlValidationPipe** (SSRF protection: private IPs, localhost, link-local, IPv6 loopback)

Patron de test para checkers:
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

### Tests E2E (5 tests)

Prueban el flujo completo via HTTP:
- Validacion de entrada (URL invalida, vacia, protocolo no soportado, campos extra)
- Manejo de errores de red (URL inalcanzable -> 502)

### Ejecucion

```bash
# Unitarios
npm test

# E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

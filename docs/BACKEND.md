# Backend: Passive HTTP Security Header Scanner

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
- [Manejo de Errores](#manejo-de-errores)
- [Validacion de Entrada](#validacion-de-entrada)
- [Testing](#testing)

## Arquitectura

El backend sigue la arquitectura modular de NestJS con 4 modulos funcionales independientes. Cada modulo encapsula una responsabilidad del dominio y se comunica con los demas a traves de la inyeccion de dependencias de NestJS.

```
HTTP Request (POST /api/scan)
       |
       v
  ScannerController  -->  ValidationPipe (DTO)
       |
       v
  ScannerService (orquestador)
       |
       +---> HttpClientService (fetch HTTP)
       |          |
       |          v
       +---> TlsCheckerService (TLS/SSL en paralelo)
       |          |
       |          v
       +---> AnalyzerService (15 checkers)
       |          |
       |          +---> ScoreCalculator
       |
       +---> ComplianceService
       |          |
       |          +---> Owaspmapper
       |          +---> Nis2Mapper
       |
       +---> ReportService (genera JSON)
       |
       v
  JSON Response
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
- `interfaces/header-checker.interface.ts` - Interface HeaderChecker + tipo HeaderResult
- `interfaces/scan-result.interface.ts` - Tipos ScanResult, ComplianceSection, ComplianceFinding, ScanMetadata
- `enums/severity.enum.ts` - Constantes SEVERITY y SEVERITY_WEIGHTS (pattern `as const`)
- `constants/header-weights.ts` - Configuracion de los 15 headers con nombre, severidad, peso, valor esperado
- `filters/http-exception.filter.ts` - Filtro global de excepciones HTTP
- `pipes/url-validation.pipe.ts` - Pipe de validacion de URL

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

Orquestador del flujo completo:
```typescript
async scan(url: string): Promise<ScanResult> {
  const httpResult = await this.httpClient.fetch(url);
  const analysisResult = this.analyzer.analyze(httpResult.headers);
  const complianceResult = this.compliance.evaluate(analysisResult.headers);
  const report = this.report.generate({ ... });
  return report;
}
```

### TechFingerprinterService

Servicio de fingerprinting que identifica tecnologias del servidor, CMS, frameworks y runtimes, y las contrasta con una base de datos de CVEs conocidos.

**Ubicacion:** `src/scanner/fingerprint/tech-fingerprinter.service.ts`

**Firmas de deteccion (13 tecnologias):**

| Tecnologia | Categoria | Metodo de deteccion |
|------------|-----------|---------------------|
| WordPress | CMS | Meta generator, wp-content paths, wp-json REST API |
| Joomla | CMS | Meta generator, component/module paths |
| Drupal | CMS | Meta generator, sites/default paths |
| PHP | Runtime | X-Powered-By header |
| Express | Framework | X-Powered-By header |
| ASP.NET | Framework | X-AspNet-Version header, cookies |
| Laravel | Framework | X-Powered-By header |
| Django | Framework | X-Powered-By, WSGI server |
| Nginx | Server | Server header |
| Apache | Server | Server header |
| Cloudflare | CDN | cf-ray, cf-cache-status headers |
| jQuery | Libreria | Script src references en HTML |
| Bootstrap | Framework | Stylesheet references en HTML |

**Base de datos de CVEs:** 20 CVEs conocidos para WordPress, Joomla, Drupal, PHP, Apache y Nginx, mapeados por rango de version semantica.

**Flujo:**
1. Toma los headers HTTP ya obtenidos por el HttpClientService
2. Fetch del HTML de la URL (best-effort, tolera fallos)
3. Ejecuta las 13 firmas de deteccion
4. Desduplica tecnologias por nombre (prioriza mayor confianza)
5. Contrasta versiones detectadas contra la base de datos de CVEs
6. Calcula grade: 1.0 sin CVEs, 0.2 si hay CVEs critical, 0.4 si high, 0.6 si medium

### SriCheckerService

Servicio que analiza el HTML de la pagina objetivo en busca de recursos externos y verifica que tengan atributo `integrity` (SRI - Subresource Integrity).

**Ubicacion:** `src/scanner/content/sri-checker.service.ts`

**Que analiza:**
- Etiquetas `<script src="...">` con y sin integridad
- Etiquetas `<link rel="stylesheet" href="...">` con y sin integridad
- Parseo con expresiones regulares sobre el HTML

**Grade:** Proporcion de recursos seguros vs totales. 1.0 si todos tienen integrity, 0 si ninguno.

### SensitiveFileCheckerService

Servicio que escanea rutas de archivos sensibles en el servidor objetivo para detectar exposiciones accidentales.

**Ubicacion:** `src/scanner/files/sensitive-file-checker.service.ts`

**Rutas escaneadas (40 paths):**

```
/.env, /.git/config, /phpinfo.php, /web.config, /.htaccess,
/wp-admin/, /wp-config.php, /admin/, /backup/, /config.php,
/crossdomain.xml, /Dockerfile, /docker-compose.yml, /credentials.json,
/.aws/credentials, /.npmrc, /.ssh/, /composer.json, /package.json,
/database.yml, /debug.log, /error.log, /install/, /logs/, /private/,
/server-status, /test.php, /Makefile, /robots.txt, /sitemap.xml
```

**Metodo:** HEAD requests en batches de 5 en paralelo con timeout de 4s. HTTP 200/204 = expuesto. 403/401 = existe pero bloqueado.

**Grade:** 1.0 si no hay expuestos, 0.7 si <=3, 0.4 si <=8, 0.1 si mas.

### SecurityFileCheckerService

Servicio que verifica la existencia y contenido de archivos de seguridad estandar en el servidor web.

**Ubicacion:** `src/scanner/files/security-file-checker.service.ts`

**Archivos verificados:**

| Archivo | Estandar | Que evalua |
|---------|----------|------------|
| `/.well-known/security.txt` | RFC 9116 | Campos obligatorios: `Contact:`, `Expires:`. Opcionales: `Encryption:`, `Policy:`, `Hiring:` |
| `/robots.txt` | Estandar de crawlers | Directivas `User-agent`, `Disallow`, `Allow`, `Sitemap`. Detecta rutas sensibles expuestas (admin, .git, .env, backup, config) |

**Metodo:** Utiliza el mismo `HttpModule` (Axios) que el `HttpClientService`, con timeout de 5s y 3 redirects.

**Analisis security.txt:**
- `Contact:` presente + `Expires:` presente = grade 1.0
- Solo `Contact:` presente = grade 0.6
- Sin `Contact:` = grade 0.3
- No encontrado (HTTP 404) = grade 0

**Analisis robots.txt:**
- Con `User-agent` y `Disallow` = grade 0.8
- Sin `Disallow` = grade 0.4
- Con rutas sensibles expuestas = grade 0.5
- Sin `User-agent` = grade 0.2
- No encontrado = grade 0

**Ejecucion:** Se ejecuta en paralelo con HTTP fetch, TLS check y DNS check via `Promise.all`.

### DnsCheckerService

Servicio que realiza verificaciones de seguridad DNS: SPF, DKIM y DMARC. Se ejecuta en paralelo con HTTP y TLS via `Promise.all`.

**Ubicacion:** `src/scanner/dns/dns-checker.service.ts`

**Tecnologia:** Modulo nativo `dns/promises` de Node.js (resolucion TXT records)

**Registros verificados:**

| Registro | Consulta DNS | Que evalua |
|----------|-------------|------------|
| SPF | `TXT {domain}` buscando `v=spf1` | Mecanismo de fail (`-all` = hard, `~all` = soft, `?all` = none), presencia de `include:` |
| DKIM | `TXT {selector}._domainkey.{domain}` (prueba 6 selectores) | `v=DKIM1`, presencia de clave publica `p=` |
| DMARC | `TXT _dmarc.{domain}` buscando `v=DMARC1` | Politica (`p=reject`, `p=quarantine`, `p=none`), reporting (`rua`), cobertura (`pct`) |

**Timeout:** 5 segundos por consulta DNS via `AbortController`.

**Grading DNS:**
```
SPF:   -all + include   = 1.0
       ~all             = 0.7
       presente sin all = 0.4
       ?all / +all      = 0.2
       ausente          = 0.0

DKIM:  v=DKIM1 con p=   = 1.0
       presente sin p=  = 0.5
       ausente          = 0.0

DMARC: p=reject + rua   = 1.0
       p=reject         = 0.9
       p=quarantine+rua = 0.8
       p=quarantine     = 0.7
       p=none           = 0.3
       ausente          = 0.0

Grade total DNS = (SPF.grade + DKIM.grade + DMARC.grade) / 3
```

### TlsCheckerService

Servicio independiente que realiza una conexion TLS raw con el servidor destino para extraer informacion del protocolo y certificado.

**Ubicacion:** `src/scanner/tls/tls-checker.service.ts`

**Tecnologia:** Node.js `tls` nativo (no Axios, que no expone detalles del certificado)

**Flujo de ejecucion:**
1. `tls.connect(port, hostname, { servername: hostname, rejectUnauthorized: false })`
2. En `secureConnect` se obtiene `socket.getProtocol()` (version TLS) y `socket.getPeerCertificate(true)` (certificado completo)
3. Timeout configurable de 8 segundos
4. En caso de error, retorna un objeto `TlsInfo` con el campo `error` poblado (NUNCA lanza excepcion)

**Datos extraidos del certificado:**

| Campo | Descripcion |
|-------|-------------|
| `subject` | Subject completo del certificado (CN, O, etc.) |
| `issuer` | Entidad emisora (CA que emitio el certificado) |
| `validFrom` | Fecha de inicio de validez |
| `validTo` | Fecha de expiracion |
| `expiresInDays` | Dias restantes hasta la expiracion |
| `expired` | Booleano: true si el certificado ha expirado |
| `selfSigned` | Booleano: true si Subject = Issuer |
| `wildcard` | Booleano: true si el CN comienza con `*.` |
| `fingerprint` | SHA256 fingerprint del certificado |
| `serialNumber` | Numero de serie del certificado |
| `san` | Lista de Subject Alternative Names (DNS) |

**Calculo del grade TLS:**

El grade TLS se calcula como 50% version del protocolo + 50% calidad del certificado:

```
tlsScore = version === 'TLSv1.3' ? 1.0
         : version === 'TLSv1.2' ? 0.8
         : version === 'TLSv1.1' ? 0.3
         : version === 'TLSv1'   ? 0.0
         :                          0.5

certScore = expired       ? 0.0
          : selfSigned    ? 0.3
          : wildcard      ? 0.7
          :                 1.0

// Penalizacion adicional por expiracion proxima
if (expiresInDays < 30)  certScore = min(certScore, 0.5)
if (expiresInDays < 90)  certScore = min(certScore, 0.8)

tlsGrade = tlsScore * 0.5 + certScore * 0.5
```

**Ejecucion en paralelo:** El `ScannerService` ejecuta `HttpClientService.fetch()` y `TlsCheckerService.check()` simultaneamente mediante `Promise.all`. Esto asegura que el escaneo TLS no agregue latencia adicional significativa.

### Analyzer Module

Corazon del sistema. Contiene el motor de analisis y los 15 checkers individuales.

**`src/analyzer/analyzer.service.ts`**
- Normaliza los nombres de headers a minusculas (HTTP headers son case-insensitive)
- Itera sobre `HEADER_WEIGHTS` (15 entradas) y ejecuta el checker correspondiente
- Si un checker no esta implementado, usa un fallback generico con grade 0.5
- Retorna `AnalysisResult` con headers[], score, grade

**`src/analyzer/score-calculator.ts`**

Implementa el algoritmo de scoring ponderado:

```
score = round( sum(weight * grade) / MAX_POSSIBLE_SCORE * 100 )
```

Donde `MAX_POSSIBLE_SCORE = 165` (suma de todos los pesos). La tabla de grados:

| Rango | Grado |
|-------|-------|
| 90-100 | A |
| 80-89 | B |
| 70-79 | C |
| 60-69 | D |
| 50-59 | E |
| 0-49 | F |

### Compliance Module

Mapea los resultados del analisis a marcos normativos.

**`src/compliance/mappers/owasp-top10.mapper.ts`**

Mapea a 3 controles del OWASP Top 10 2021:

| Control | Headers Relacionados | Logica |
|---------|---------------------|--------|
| A01.1 - CORS Configuration | Access-Control-Allow-Origin | Wildcard = non_compliant, especifico = compliant |
| A01.2 - Cookie Security | Set-Cookie | Flags faltantes = non_compliant |
| A05.1 - Critical Security Headers | CSP, HSTS, XFO, CORS, Set-Cookie | Cualquier critical/high con grade < 0.5 = non_compliant |
| A05.2 - High Priority Headers | (high severity) | High con grade < 0.5 = partially_compliant |
| A05.3 - TLS Configuration | TLS info (version, cert) | TLS < 1.2, expirado, self-signed = non_compliant |
| A06.1 - Information Disclosure | X-Powered-By, Server | Presente = non_compliant |

**`src/compliance/mappers/nis2.mapper.ts`**

Mapea a 4 controles del Articulo 21 de la Directiva NIS2 2023:

| Control | Headers Relacionados | Logica |
|---------|---------------------|--------|
| Art.21(c) - Access Control | CORS, Set-Cookie, COOP | Configuracion debil = non_compliant |
| Art.21(d) - Incident Handling | CSP (report-uri/report-to) | Sin reporting = partially_compliant |
| Art.21(g) - Supply Chain Security | CORP, COEP | Permisivo = partially_compliant |
| Art.21(i) - Cryptography | HSTS, TLS info (version, cert) | Sin HSTS = non_compliant. Evalua TLS version real, expiracion de certificado, self-signed. HTTP sin TLS = non_compliant |

### Compliance Mappers

Ademas de los mappers OWASP Top 10 y NIS2, se incorporan dos nuevos marcos normativos:

#### ENS Mapper (`src/compliance/mappers/ens.mapper.ts`)

Mapea los hallazgos contra el Esquema Nacional de Seguridad (Real Decreto 311/2022):

| Control | Evalua | Descripcion |
|---------|--------|-------------|
| op.acc.2 - Control de acceso | CORS, COOP, Set-Cookie | Accesos no autorizados desde origen cruzado |
| op.exp.5 - Proteccion de informacion | X-Powered-By, Server | Fuga de informacion tecnologica |
| op.pl.3 - Seguridad perimetral | CSP, HSTS, X-Frame-Options | Defensa del perimetro web |
| op.mon.2 - Monitorizacion | DMARC | Capacidad de monitoreo de correo |
| op.cont.2 - Continuidad | TLS cert expiry | Renovacion de certificados |
| org.organizacion - Marco organizativo | security.txt | Canal de divulgacion de vulnerabilidades |
| op.vuln - Gestion de vulnerabilidades | Fingerprinting + CVEs | Parcheado de tecnologias |

#### ISO 27001 Mapper (`src/compliance/mappers/iso27001.mapper.ts`)

Mapea los hallazgos contra la norma ISO 27001:2022:

| Control | Evalua | Descripcion |
|---------|--------|-------------|
| A.5.1 - Politicas de seguridad | security.txt | Politica de divulgacion |
| A.9.1 - Control de acceso | CORS, COOP | Restriccion de accesos |
| A.10.1 - Controles criptograficos | HSTS, TLS version, cert | Cifrado y comunicaciones seguras |
| A.12.6 - Gestion de vulnerabilidades | Fingerprinting + CVEs | Vulnerabilidades conocidas |
| A.13.1 - Seguridad de redes | CSP, XFO, XCTo | Seguridad perimetral |
| A.13.2 - Transferencia de informacion | TLS | Cifrado en transferencia |
| A.16.1 - Gestion de incidentes | CSP reporting, DMARC | Deteccion de incidentes |
| A.18.1 - Cumplimiento normativo | Headers, TLS, DNS | Cumplimiento general |

### Export Service

Servicio para exportar reportes en formatos descargables.

**Ubicacion:** `src/report/export/export.service.ts`

**Metodos:**

| Metodo | Formato | Descripcion |
|--------|---------|-------------|
| `generateJson(result)` | JSON | Serializa el ScanResult como JSON indentado |
| `generatePdf(result)` | PDF | Genera un documento PDF profesional utilizando `pdfkit` |

**Endpoint:** `POST /api/export`

**Estructura del PDF generado:**
1. **Header** - titulo, URL, fecha, metadata duracion/status
2. **Score** - Grado y puntaje con descripcion visual y texto explicativo
3. **TLS/SSL** - Version TLS, grade, datos del certificado (sujeto, emisor, validez, SAN)
4. **Headers de Seguridad** - Lista de los 15 headers con severidad, grade, hallazgo y recomendacion
5. **Cumplimiento Normativo** - OWASP Top 10 y NIS2 con estados coloreados
6. **Recomendaciones** - Lista priorizada por severidad (CRITICAL primero)
7. **Footer** - Fecha de generacion y version de la herramienta

**Endpoint:** `POST /api/export`

**Request:**
```json
{ "url": "https://example.com", "format": "pdf" }
```

**Response:** Archivo descargable con headers `Content-Disposition: attachment` y `Content-Type` adecuado.

### Report Module

Genera la respuesta JSON final.

**`src/report/report.service.ts`**
- Compone el objeto `ScanResult` con todos los datos
- Genera recomendaciones ordenadas por severidad (critical primero, low ultimo)
- Las recomendaciones incluyen el prefijo `[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`

## Sistema de Scoring

### Pesos por Severidad

| Severidad | Peso |
|-----------|------|
| critical | 25 |
| high | 15 |
| medium | 10 |
| low | 5 |

### Grade TLS

El grade TLS se calcula independientemente de los headers y se incluye en el reporte como informacion adicional. No afecta el score general del scanner (basado en headers). Ver seccion `TlsCheckerService` para el algoritmo completo.

### Calculo por Header

Cada header recibe un `grade` entre 0.0 y 1.0 segun estas reglas generales:

| Estado | Grade |
|--------|-------|
| Header presente y valor correcto | 1.0 |
| Header presente pero valor suboptimo | 0.3 - 0.8 (segun header) |
| Header presente pero valor incorrecto | 0.0 - 0.3 |
| Header ausente | 0.0 |

Excepciones notables:
- `Access-Control-Allow-Origin`: ausente = 1.0 (sin CORS = seguro por defecto)
- `Set-Cookie`: ausente = 1.0 (sin cookies = seguro por defecto)
- `X-Powered-By`: ausente = 1.0 (sin fuga de informacion)
- `Server`: ausente = 1.0
- `X-XSS-Protection`: ausente = 1.0 (deprecado, se prefiere CSP)

### Recomendaciones

El `ReportService` recolecta todas las recomendaciones de headers con `grade < 1.0` y las ordena por severidad descendente, agregando el prefijo `[SEVERIDAD]`.

## Header Checkers

Cada checker es una clase que implementa `HeaderChecker`. A continuacion el detalle de cada uno:

### CSP (critical, peso 25)
- Evalua presencia de `default-src`, `script-src`, `object-src`
- Detecta `unsafe-inline` y `unsafe-eval` (penaliza a grade <= 0.4)
- Policy estricta sin unsafe-inline/eval + directivas clave = grade 1.0

### HSTS (high, peso 15)
- Evalua `max-age` (>= 31536000 = mejor)
- Detecta `includeSubDomains` y `preload`
- Sin header = grade 0, completo = grade 1.0

### X-Frame-Options (high, peso 15)
- `DENY` = 1.0, `SAMEORIGIN` = 0.8, `ALLOW-FROM` = 0.5

### X-Content-Type-Options (medium, peso 10)
- `nosniff` = 1.0, cualquier otro valor = 0.3

### Referrer-Policy (medium, peso 10)
- Politicas estrictas (`no-referrer`, `strict-origin-when-cross-origin`, etc.) = 1.0
- `unsafe-url` = 0.3, otros = 0.5

### Permissions-Policy (medium, peso 10)
- Detecta wildcards `(*)` (penaliza a 0.2)
- Presencia de restricciones a APIs sensibles mejora el grade

### Cache-Control (medium, peso 10)
- `no-store` = 1.0, `no-cache + private` = 0.7, `public` = 0.2

### CORS (high, peso 15)
- Ausente = 1.0 (seguro), origen especifico = 1.0
- Wildcard `*` = 0, `null` = 0.1

### Set-Cookie (high, peso 15)
- Analiza cada cookie individualmente (soportando multiples cookies)
- Evalua flags: `Secure`, `HttpOnly`, `SameSite`
- Toma el peor grade entre todas las cookies
- Maneja correctamente comas en fechas de expiracion

### CORP (medium, peso 10)
- `same-origin` = 1.0, `same-site` = 0.8, `cross-origin` = 0.1

### COOP (medium, peso 10)
- `same-origin` = 1.0, `same-origin-allow-popups` = 0.6, `unsafe-none` = 0

### COEP (low, peso 5)
- `require-corp` = 1.0, `credentialless` = 0.6, `unsafe-none` = 0

### X-Powered-By (low, peso 5)
- Ausente = 1.0, presente = 0 (fuga de informacion)

### Server (low, peso 5)
- Ausente = 1.0, minimal (`cloudflare`, `nginx`) = 0.5, verbose = 0

### X-XSS-Protection (low, peso 5)
- Ausente o `0` = 1.0 (deprecado, CSP es el mecanismo moderno)
- `1; mode=block` = 0.3 (obsoleto)

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
- Verifica que el hostname sea un FQDN (contenga al menos un punto) o sea localhost/127.0.0.1

### DTO Validation (`ScanRequestDto`)

- `@IsString()`: debe ser string
- `@IsNotEmpty()`: no vacio
- `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })`: URL valida con protocolo explicito
- `whitelist: true`: elimina campos no declarados en el DTO
- `forbidNonWhitelisted: true`: rechaza peticiones con campos extra

## Testing

### Tests Unitarios (83 tests)

Los tests unitarios cubren:
- Cada checker individualmente (15 archivos de test)
- Score calculator con combinaciones de headers
- Mappers de compliance (OWASP y NIS2)
- ScannerService con dependencias mockeadas

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

# Auditoria de Seguridad Web

Herramienta de auditoria pasiva de seguridad web que analiza los headers HTTP de respuesta de cualquier URL publica, genera un puntaje de seguridad (0-100), identifica headers faltantes o mal configurados, y mapea los resultados contra los frameworks OWASP Top 10, Directiva NIS2, ENS (Esquema Nacional de Seguridad) e ISO 27001.

## Tabla de Contenidos

- [Descripcion General](#descripcion-general)
- [Stack Tecnologico](#stack-tecnologico)
- [Requerimientos](#requerimientos)
- [Inicio Rapido](#inicio-rapido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentacion](#documentacion)
- [Testing](#testing)
- [Licencia](#licencia)

## Descripcion General

La herramienta recibe una URL via API REST, realiza una peticion HTTP a la misma, extrae los headers de respuesta, y los analiza contra 15 parametros de seguridad definidos por el OWASP Secure Headers Project. Cada header recibe una calificacion de 0.0 a 1.0 segun su presencia y configuracion. La calificacion total se pondera por severidad para obtener un score 0-100 con grado A-F.

Adicionalmente, los hallazgos se mapean automaticamente a los controles del OWASP Top 10 (2021) y a los requisitos del Articulo 21 de la Directiva NIS2 (2023).

Casos de uso:
- Auditoria de seguridad de aplicaciones web
- Verificacion de cumplimiento normativo
- Seguimiento continuo de la postura de seguridad
- Proyectos academicos y formacion en ciberseguridad

## Stack Tecnologico

### Backend

| Componente | Tecnologia |
|------------|------------|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Lenguaje | TypeScript 5 |
| HTTP Client | Axios (via @nestjs/axios 4) |
| Validacion | class-validator + class-transformer |
| Documentacion API | Swagger / OpenAPI (via @nestjs/swagger) |
| Testing | Jest + supertest |

### Frontend

| Componente | Tecnologia |
|------------|------------|
| Framework | React 19 |
| Bundler | Vite 8 |
| Lenguaje | TypeScript 5 |
| Proxy dev | Vite server.proxy (/api -> backend) |

## Requerimientos

- Node.js >= 18
- npm >= 9
- Conexion a internet (para escanear URLs externas)

## Inicio Rapido

```bash
# 1. Clonar o copiar el proyecto
cd auditoria-web

# 2. Instalar dependencias del backend
npm install

# 3. Construir el backend
npm run build

# 4. Iniciar el backend (puerto 3000)
node dist/main.js

# 5. En otra terminal, instalar e iniciar el frontend
cd frontend
npm install
npm run dev     # Puerto 5173 con proxy a :3000
```

La aplicacion queda accesible en:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/scan
- Exportacion: http://localhost:3000/api/export
- Documentacion Swagger: http://localhost:3000/api/docs

### Uso con curl (sin frontend)

```bash
# Escanear y ver resultado en JSON
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Exportar reporte PDF
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"pdf"}' \
  --output reporte.pdf

# Exportar reporte JSON
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"json"}' \
  --output reporte.json
```

## Estructura del Proyecto

```
auditoria-web/
├── src/                          # Backend NestJS
│   ├── main.ts                   # Bootstrap + Swagger
│   ├── app.module.ts             # Modulo raiz
│   ├── common/                   # Interfaces, constantes, filtros, pipes
│   ├── scanner/                  # Controller, DTOs, HTTP client, TLS, DNS, files, content, fingerprint
│   │   ├── tls/                  #   Verificacion TLS/SSL
│   │   ├── dns/                  #   Verificacion DNS (SPF/DKIM/DMARC)
│   │   ├── files/                #   Security.txt + robots.txt + sensitive files
│   │   ├── content/              #   SRI (Subresource Integrity)
│   │   └── fingerprint/          #   Tech fingerprinting + CVE detection
│   ├── analyzer/                 # Score calculator + 15 header checkers
│   ├── compliance/               # Mappers OWASP Top 10 + NIS2
│   └── report/
│       ├── export/               # Export PDF/JSON service
│       └── ...                   # Generacion de reportes
├── test/                         # Tests unitarios y e2e
│   ├── unit/                     # 19 suites de tests (83 tests)
│   └── e2e/                      # Tests de integracion
├── frontend/                     # Frontend React + Vite
│   ├── src/
│   │   ├── App.tsx               # Componente principal
│   │   └── App.css               # Estilos
│   ├── index.html
│   └── vite.config.ts            # Proxy a backend
├── docs/                         # Documentacion detallada
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   └── GUIA_USO.md
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Documentacion

- [docs/BACKEND.md](docs/BACKEND.md): Arquitectura del backend, modulos, checkers, scoring, API
- [docs/FRONTEND.md](docs/FRONTEND.md): Frontend React + Vite, componentes, proxy, build
- [docs/GUIA_USO.md](docs/GUIA_USO.md): Guia de uso e interpretacion de resultados

## Testing

```bash
# Tests unitarios (83 tests, 19 suites)
npm test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## API Reference

### POST /api/export

Escanea una URL y descarga el reporte en formato PDF o JSON.

**Request body:**
```json
{
  "url": "https://example.com",
  "format": "pdf"
}
```

**Formatos:**
| Formato | Content-Type | Uso |
|---------|-------------|-----|
| `json` | application/json | Procesamiento automatico, integracion con herramientas |
| `pdf` | application/pdf | Evidencia tecnica para audits, compliance, informes |

**Response:** Archivo descargable con `Content-Disposition: attachment`.

### POST /api/scan

Escanea una URL y devuelve un reporte de seguridad.

**Request body:**
```json
{
  "url": "https://example.com"
}
```

**Response (200 OK):**
```json
{
  "url": "https://example.com",
  "timestamp": "2026-05-11T20:00:00.000Z",
  "score": 71,
  "grade": "C",
  "headers": [
    {
      "header": "Content-Security-Policy",
      "present": true,
      "value": "default-src 'self'",
      "grade": 0.4,
      "severity": "critical",
      "weight": 25,
      "finding": "CSP is present but contains unsafe-inline",
      "recommendation": "Remove unsafe directives"
    }
  ],
  "compliance": [
    {
      "framework": "OWASP Top 10",
      "version": "2021",
      "findings": [...]
    },
    {
      "framework": "NIS2 Directive",
      "version": "2023",
      "findings": [...]
    }
  ],
  "recommendations": [
    "[CRITICAL] Implement a strict CSP policy...",
    "[HIGH] Add: Strict-Transport-Security..."
  ],
  "tls": {
    "checked": true,
    "hostname": "example.com",
    "port": 443,
    "error": null,
    "tlsVersion": "TLSv1.3",
    "certificate": {
      "subject": "CN=example.com",
      "issuer": "C=US, O=Example CA",
      "validFrom": "Jan 1 00:00:00 2025 GMT",
      "validTo": "Jan 1 00:00:00 2026 GMT",
      "expiresInDays": 100,
      "expired": false,
      "selfSigned": false,
      "wildcard": false,
      "fingerprint": "AA:BB:CC:DD:EE:FF:00:11...",
      "serialNumber": "1234567890",
      "san": ["example.com"]
    },
    "grade": 1.0
  },
  "dns": {
    "hostname": "example.com",
    "checked": true,
    "error": null,
    "spf": {
      "type": "SPF", "value": "v=spf1 include:_spf.google.com -all",
      "present": true, "grade": 1.0,
      "finding": "SPF record with hard fail and authorised senders",
      "recommendation": "SPF is properly configured"
    },
    "dkim": {
      "type": "DKIM", "value": "v=DKIM1; p=...",
      "present": true, "grade": 1.0,
      "finding": "DKIM record found with public key",
      "recommendation": "DKIM is properly configured"
    },
    "dmarc": {
      "type": "DMARC", "value": "v=DMARC1; p=reject; rua=mailto:dmarc@...",
      "present": true, "grade": 1.0,
      "finding": "DMARC with p=reject and reporting",
      "recommendation": "DMARC is properly configured"
    },
    "grade": 1.0
  },
  "metadata": {
    "responseTime": 212,
    "statusCode": 200,
    "analyzedAt": "2026-05-11T20:00:00.000Z"
  }
}
```

**Errores:**
| Codigo | Significado |
|--------|-------------|
| 400 | URL invalida o mal formada |
| 502 | No se pudo alcanzar el destino (DNS, timeout, SSL) |

## Headers Analizados

| Header | Severidad | Peso | Funcion |
|--------|-----------|------|---------|
| Content-Security-Policy | critical | 25 | Previene XSS e inyeccion de datos |
| Strict-Transport-Security | high | 15 | Fuerza conexiones HTTPS |
| X-Frame-Options | high | 15 | Previene clickjacking |
| X-Content-Type-Options | medium | 10 | Previene MIME sniffing |
| Referrer-Policy | medium | 10 | Controla fuga de informacion referente |
| Permissions-Policy | medium | 10 | Restringe APIs del navegador |
| Cache-Control | medium | 10 | Previene cacheo de datos sensibles |
| Access-Control-Allow-Origin | high | 15 | Previene abuso CORS |
| Set-Cookie | high | 15 | Flags de seguridad en cookies |
| Cross-Origin-Resource-Policy | medium | 10 | Previene carga cross-origin |
| Cross-Origin-Opener-Policy | medium | 10 | Aislamiento contra ataques cross-origin |
| Cross-Origin-Embedder-Policy | low | 5 | Previene embedding cross-origin |
| X-Powered-By | low | 5 | Detecta fuga de tecnologia |
| Server | low | 5 | Detecta fuga de informacion del servidor |
| X-XSS-Protection | low | 5 | Header deprecado (se prefiere CSP) |

## Verificaciones Adicionales

### TLS / SSL
- Version del protocolo (TLSv1.3, TLSv1.2, etc.)
- Estado del certificado (validez, emisor, expiracion, SAN, self-signed, wildcard)
- Alerta preventiva cuando el certificado expira en menos de 30 dias

### DNS / Email Security
- **SPF**: registro TXT del dominio verificando mecanismo all e include
- **DKIM**: busqueda en selectores comunes (default, google, selector1, etc.)
- **DMARC**: registro `_dmarc.{dominio}` con politica, reporting y cobertura

### Archivos de Seguridad
- **security.txt** (RFC 9116): deteccion y analisis de campos obligatorios (Contact, Expires)
- **robots.txt**: deteccion de rutas sensibles expuestas (admin, backup, .git, .env)

### Subresource Integrity (SRI)
- Analisis de etiquetas `<script src>` y `<link rel="stylesheet" href>` en el HTML
- Verifica presencia del atributo `integrity` en cada recurso externo
- Recursos sin SRI se muestran truncados con opcion de expandir al hacer click

### Archivos Sensibles
- Escaneo de 40 rutas sensibles comunes (`.env`, `.git/config`, `phpinfo.php`, `web.config`, `.htaccess`, etc.)
- HEAD requests en lotes de 5 en paralelo para detectar exposicion accidental

### Fingerprinting de Tecnologias
- Deteccion de CMS: WordPress, Joomla, Drupal (via meta generator, paths, headers)
- Deteccion de frameworks: Express, ASP.NET, Laravel, Django, jQuery, Bootstrap
- Deteccion de servidores: Nginx, Apache, Cloudflare
- Deteccion de runtimes: PHP
- Base de datos integrada de **20 CVEs conocidos** mapeados por tecnologia y version
- Las recomendaciones de CVEs aparecen con severidad CRITICAL/HIGH/MEDIUM

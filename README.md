# Auditoría de Seguridad Web v2.0

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
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Testing](#testing)
- [Licencia](#licencia)

## Descripción General

La herramienta recibe una URL vía API REST, realiza una petición HTTP a la misma, extrae los headers de respuesta y los analiza contra 15 parámetros de seguridad del OWASP Secure Headers Project. Cada header recibe una calificación (0.0-1.0) según su presencia y configuración. La calificación total se pondera por severidad para obtener un score 0-100 con grado A-F.

**¿Qué hace realmente?**

| Componente | ¿Qué mide? | ¿Qué NO mide? |
|-----------|-----------|--------------|
| **Headers HTTP** | Presencia, valor y configuración de 15 headers | Vulnerabilidades XSS, SQLi en el contenido |
| **TLS/SSL** | Versión del protocolo, datos del certificado | Configuración de cifrado, vulnerabilidades TLS |
| **DNS** | Registros SPF, DKIM, DMARC | Seguridad del servidor DNS, DNSSEC |
| **Archivos sensibles** | Accesibilidad HTTP de 40 rutas comunes | Contenido real de los archivos (puede dar falsos positivos) |
| **Fingerprinting** | Tecnologías detectadas en headers y HTML | Versiones exactas no verificadas |
| **CVEs** | 20 CVEs en base de datos interna (MUY LIMITADA) | Vulnerabilidades reales del sitio |
| **Compliance** | Mapeo automático basado en headers | Auditoría de compliance real (mucho más amplia) |

### Casos de uso apropiados

- Formación académica en ciberseguridad
- Demostración de conceptos de seguridad web
- Verificación rápida e informal de headers HTTP
- Proyectos personales y experimentación

### Casos de uso INAPROPIADOS

- Auditorías de seguridad profesionales o contractuales
- Toma de decisiones sin verificación manual
- Evaluación de cumplimiento normativo formal
- Herramienta única en un proceso de pentesting

## Stack Tecnológico

### Backend

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Lenguaje | TypeScript 5 |
| HTTP Client | Axios (via @nestjs/axios 4) |
| Validación | class-validator + class-transformer |
| Documentación API | Swagger / OpenAPI (via @nestjs/swagger) |
| Testing | Jest + supertest |
| Export PDF | PDFKit |

### Frontend

| Componente | Tecnología |
|------------|------------|
| Framework | React 19 |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js |
| Lenguaje | TypeScript 6 |

## Limitaciones Conocidas

### 1. Naturaleza Académica

Esta herramienta fue desarrollada como proyecto de fin de Máster en Ciberseguridad. No ha sido sometida a auditoría de código, revisión de seguridad por terceros, ni certificación de ningún tipo.

### 2. Cobertura Parcial de Compliance

El mapeo a OWASP Top 10, NIS2, ENS e ISO 27001 es **automático y basado exclusivamente en headers HTTP**. Estos frameworks son mucho más amplios e incluyen requisitos organizativos, de procesos y técnicos que no pueden verificarse solo con headers. **El reporte de compliance es indicativo, no concluyente.**

### 3. Base de Datos de CVEs Limitada

La detección de CVEs utiliza una base de datos interna de **solamente 20 CVEs** hardcodeados. Esto significa que:
- La ausencia de CVEs detectados **NO implica** que el sitio esté libre de vulnerabilidades
- La base no se actualiza automáticamente
- No cubre la mayoría de vulnerabilidades conocidas
- **No reemplaza** herramientas como Nmap, OpenVAS, Nessus o Snyk

### 4. Score Numérico Heurístico

El score 0-100 se basa en pesos asignados por decisión de diseño (CSP=25, HSTS=15, etc.). No existe un estándar universal para ponderar headers de seguridad. El score es una **guía visual útil, no una certificación de seguridad**.

### 5. Falsos Positivos en Archivos Sensibles

El escaneo de archivos sensibles puede reportar **falsos positivos**: servidores que devuelven HTTP 200 con contenido genérico (soft 404) en rutas como `/.env` o `/.git/config`. Verificar manualmente cada hallazgo antes de actuar.

### 6. Sin Autenticación ni Sesiones

La herramienta no soporta escaneo detrás de login, formularios de autenticación ni sitios que requieran sesión. Solo analiza URLs públicas accesibles sin credenciales.

### 7. Dependencia de Red

Los resultados dependen de:
- La conectividad con el servidor destino
- Firewalls, WAFs y CDNs que pueden modificar headers
- La resolución DNS del entorno donde se ejecute
- Timeouts y latencia de red

## Requerimientos

- Node.js >= 18
- npm >= 9
- Conexión a internet (para escanear URLs externas)

## Inicio Rápido

```bash
# 1. Instalar dependencias del backend
cd auditoria-web
npm install
npm run build

# 2. Iniciar el backend (puerto 3000)
node dist/main.js

# 3. En otra terminal, instalar e iniciar el frontend
cd frontend
npm install
npm run dev     # Puerto 5173 con proxy a :3000
```

La aplicación queda accesible en:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/scan
- Exportación: http://localhost:3000/api/export
- Documentación Swagger: http://localhost:3000/api/docs

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
```

## Estructura del Proyecto

```
auditoria-web/
├── src/                          # Backend NestJS
│   ├── main.ts                   # Bootstrap + Swagger
│   ├── app.module.ts             # Módulo raíz
│   ├── common/                   # Interfaces, constantes, filtros, pipes
│   ├── scanner/                  # Controller, DTOs, HTTP client, TLS, DNS, files, content, fingerprint
│   ├── analyzer/                 # Score calculator + 15 header checkers
│   ├── compliance/               # Mappers OWASP, NIS2, ENS, ISO 27001
│   └── report/                   # Export PDF/JSON + generación de reportes
├── test/                         # Tests unitarios (83) y e2e
├── frontend/                     # Frontend React + Vite + Tailwind
│   └── src/
│       ├── components/           # 13 componentes React
│       ├── lib/cn.ts             # Utilidad Tailwind
│       └── types.ts              # Interfaces TypeScript
├── docs/                         # Documentación detallada
└── package.json
```

## Documentación

- [docs/BACKEND.md](docs/BACKEND.md): Arquitectura del backend, módulos, checkers, scoring, API
- [docs/FRONTEND.md](docs/FRONTEND.md): Frontend React + Vite + Tailwind, componentes
- [docs/GUIA_USO.md](docs/GUIA_USO.md): Guía de uso e interpretación de resultados

## Testing

```bash
# Tests unitarios (83 tests, 19 suites)
npm test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
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

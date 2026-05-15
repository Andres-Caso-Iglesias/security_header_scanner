# Frontend — Auditoría de Seguridad Web v2.1

Frontend en React 19 + Vite 8 + Tailwind CSS 4 para la herramienta de auditoría de seguridad web.

> ⚠️ Proyecto académico — No usar como única herramienta de auditoría profesional.

## Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 19 | UI |
| TypeScript | 6 | Tipado |
| Vite | 8 | Bundler / dev server |
| Tailwind CSS | 4 | Estilos |
| Chart.js | 4 | Gráficos (DNS, SRI) |
| Vitest | 3 | Testing |
| React Testing Library | 16 | Testing de componentes |

## Scripts

```bash
npm run dev         # Dev server (localhost:5173)
npm run build       # Build producción → dist/
npm run lint        # ESLint
npm run preview     # Vista previa del build
npm test            # Tests (26 tests, 5 suites)
npm run test:watch  # Tests en modo watch
```

## Estructura

```
src/
├── main.tsx                  Entry point
├── index.css                 Tailwind + tema + animaciones
├── App.tsx                   Orquestador principal
├── types.ts                  Interfaces del dominio
├── lib/
│   └── cn.ts                 Utilidad Tailwind (clsx + tailwind-merge)
├── test/
│   ├── setup.ts              Config Vitest
│   ├── mock-data.ts          Datos mock
│   └── components/           26 tests
└── components/               14 componentes
    ├── ScoreCircle.tsx        SVG animado de puntuación
    ├── ScanForm.tsx           Input URL + botón escanear
    ├── MetaSection.tsx        Score + metadatos + exportación
    ├── SslWarning.tsx         Alerta de certificado expirado
    ├── HeaderGrid.tsx         Grid de headers con filtro
    ├── TlsSection.tsx         Datos TLS/SSL
    ├── DnsSection.tsx         Registros DNS + gráfico
    ├── SriSection.tsx         SRI + gráfico
    ├── FingerprintSection.tsx Fingerprinting + CVEs
    ├── SensitiveSection.tsx   Archivos sensibles expuestos
    ├── RecommendationsSection.tsx Recomendaciones por severidad
    ├── ComplianceGrid.tsx     Frameworks normativos + disclaimer
    ├── ScanProgress.tsx       Progreso de escaneo en tiempo real
    └── ErrorBoundary.tsx      Captura errores por tab
```

## Docker

```bash
docker build -t auditoria-frontend .
docker run -p 5173:80 auditoria-frontend
```

O via docker-compose desde la raíz del proyecto.

## API

El frontend se comunica con el backend NestJS. En desarrollo via proxy de Vite, en producción via Nginx.

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/scan` | POST | Ejecuta escaneo de URL |
| `/api/export` | POST | Descarga reporte (JSON/PDF) |

## Tests

```bash
npm test            # Ejecuta todos los tests
npm run test:watch  # Modo watch
```

26 tests distribuidos en 5 archivos:
- `ScoreCircle.test.tsx` — render, colores, tooltip
- `HeaderGrid.test.tsx` — filtro por severidad
- `MetaSection.test.tsx` — métricas, botones de descarga
- `ComplianceGrid.test.tsx` — disclaimer, frameworks
- `SslWarning.test.tsx` — certificado expirado/próximo

## Limitaciones

- No tiene autenticación ni manejo de sesiones
- No almacena historial de escaneos
- Los resultados dependen del backend y la conectividad de red
- Esta es una herramienta académica, no un producto de seguridad profesional

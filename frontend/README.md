# Frontend — Auditoría de Seguridad Web

Frontend en React 19 + Vite 8 + Tailwind CSS 4 para la herramienta de auditoría de seguridad web.

> Proyecto académico — No usar como única herramienta de auditoría profesional.

## Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 19 | UI |
| TypeScript | 6 | Tipado |
| Vite | 8 | Bundler / dev server |
| Tailwind CSS | 4 | Estilos |
| Chart.js | 4 | Gráficos (DNS, SRI) |

## Scripts

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # Build producción → dist/
npm run lint     # ESLint
npm run preview  # Vista previa del build
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
└── components/
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
    ├── ComplianceGrid.tsx     Frameworks normativos
    └── SecurityFilesSection.tsx  security.txt + robots.txt
```

## API

El frontend se comunica con el backend NestJS a través de un proxy de Vite.

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/scan` | POST | Ejecuta escaneo de URL |
| `/api/export` | POST | Descarga reporte (JSON/PDF) |

Proxy configurado en `vite.config.ts`: `/api` → `http://localhost:3000`.

## Limitaciones

- No tiene autenticación ni manejo de sesiones
- No almacena historial de escaneos
- Los resultados dependen del backend y la conectividad de red
- Esta es una herramienta académica, no un producto de seguridad profesional

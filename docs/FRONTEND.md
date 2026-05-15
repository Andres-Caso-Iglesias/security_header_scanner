# Frontend: React + Vite + Tailwind

> **PROYECTO ACADEMICO** — Esta herramienta fue desarrollada como proyecto de Master en Ciberseguridad.
> Los resultados son orientativos. No utilizar como unico instrumento de auditoria profesional.

Documentacion tecnica del frontend de la herramienta de auditoria de seguridad web.

## Tabla de Contenidos

- [Stack](#stack)
- [Estructura](#estructura)
- [Componentes](#componentes)
- [Layout de Resultados](#layout-de-resultados)
- [Exportacion de Reportes](#exportacion-de-reportes)
- [Proxy y Comunicacion con Backend](#proxy-y-comunicacion-con-backend)
- [Estados de la UI](#estados-de-la-ui)
- [Build y Deploy](#build-y-deploy)

## Stack

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19 | Libreria de UI |
| Vite | 8 | Bundler y dev server |
| TypeScript | 6 | Tipado |
| Tailwind CSS | 4 | Estilos (utility-first) |
| Chart.js | 4 | Graficos (donut de DNS y SRI) |

## Estructura

```
frontend/
├── index.html              # HTML base (con Inter font)
├── vite.config.ts          # Configuracion Vite + Tailwind plugin + proxy
├── package.json
├── src/
│   ├── main.tsx            # Entry point (ReactDOM.createRoot)
│   ├── index.css           # Tailwind import + tema + animaciones
│   ├── App.tsx             # Orquestador principal
│   ├── types.ts            # Interfaces del dominio
│   ├── lib/
│   │   └── cn.ts           # Utilidad clsx + tailwind-merge
│   └── components/         # 13 componentes
│       ├── ScoreCircle.tsx
│       ├── ScanForm.tsx
│       ├── MetaSection.tsx
│       ├── SslWarning.tsx
│       ├── HeaderGrid.tsx
│       ├── TlsSection.tsx
│       ├── DnsSection.tsx
│       ├── SriSection.tsx
│       ├── FingerprintSection.tsx
│       ├── SensitiveSection.tsx
│       ├── RecommendationsSection.tsx
│       ├── ComplianceGrid.tsx
│       └── SecurityFilesSection.tsx
└── dist/                   # Build de produccion
```

## Componentes

La aplicacion se organiza en 13 componentes independientes bajo `src/components/`, mas el orquestador `App.tsx`.

### ScoreCircle

Renderiza un grafico circular SVG animado con:
- Circulo de fondo
- Arco de progreso coloreado segun el grado (A-F)
- Texto SVG centrado: letra del grade + puntuacion numerica
- Subtitulo "SECURITY SCORE" debajo del grafico con **tooltip informativo** (icono `?`) que explica la formula de calculo del score y sus limitaciones

### ComplianceGrid

Cuatro tarjetas en fila (OWASP, NIS2, ENS, ISO 27001), cada una con score, dots de estado y lista de findings.
Incluye un **banner de disclaimer** al inicio que advierte: "Mapeo automatico basado solo en headers. No reemplaza una auditoria formal."

### SecurityFilesSection

Dos tarjetas (security.txt y robots.txt) con estado encontrado/ausente, contenido y recomendaciones.

## Layout de Resultados

La seccion de resultados utiliza tabs para organizar la informacion:

```
+------------------------------------------------------------+
|  [ScoreCircle]  [URL]                                       |
|                  [HTTP Status] [Tiempo] [Headers] [TLS][DNS]|
|                  [Descargar JSON] [Descargar PDF]           |
+------------------------------------------------------------+
|  [SSL Warning - si aplica]                                  |
+------------------------------------------------------------+
|  Headers | Cumplimiento | TLS/SSL | DNS | SRI | ...        |
+------------------------------------------------------------+
|  Contenido del tab activo                                   |
+------------------------------------------------------------+
|  Archivos de Seguridad (siempre visible)                    |
+------------------------------------------------------------+
|  Footer                                                     |
+------------------------------------------------------------+
```

## Exportacion de Reportes

El frontend provee 2 mecanismos de exportacion via `POST /api/export`:

| Boton | Formato | Comportamiento |
|-------|---------|---------------|
| Descargar JSON | .json | fetch → Blob → download link |
| Descargar PDF | .pdf | fetch → Blob → download link |

Todos llaman al endpoint `POST /api/export` con el formato correspondiente.

## Proxy y Comunicacion con Backend

En desarrollo, Vite redirige las peticiones `/api/*` al backend NestJS:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

El frontend llama a la API usando fetch relativo:

```typescript
const res = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url }),
});
```

De esta forma no hay problemas de CORS durante el desarrollo. El proxy tambien funciona para el endpoint `/api/export`.

## Estados de la UI

La aplicacion maneja 4 estados visuales:

### Estado inicial
- Header con titulo y descripcion
- Input de URL + boton "Escanear"
- Pills informativas (15+ headers, TLS/DNS, compliance)

### Estado de carga
- Skeleton loaders (circulo + rectangulos animados)
- Input deshabilitado
- Boton con spinner SVG

### Estado de exito
- ScoreCircle con animacion del arco
- SSL Warning (si aplica)
- Tabs: Headers, Cumplimiento, TLS/SSL, DNS, SRI, Fingerprinting, Sensibles, Recomendaciones
- Contenido del tab activo
- Archivos de Seguridad (siempre visibles)
- Botones de exportacion funcionales

### Estado de error
- Banner con fondo rojo y mensaje de error
- El formulario permanece interactivo para reintentar

## Build y Deploy

### Desarrollo

```bash
cd frontend
npm run dev
```

Inicia servidor en http://localhost:5173 con HMR.

### Produccion

```bash
cd frontend
npm run build
```

Genera los archivos estaticos en `dist/`:
- `dist/index.html`
- `dist/assets/index-*.css`
- `dist/assets/index-*.js`

### Deploy integrado con NestJS

Para servir el frontend desde el propio NestJS en produccion:

1. Construir el frontend: `cd frontend && npm run build`
2. Configurar NestJS para servir archivos estaticos desde `frontend/dist/`
3. Acceder a la aplicacion via el puerto de NestJS (3000)

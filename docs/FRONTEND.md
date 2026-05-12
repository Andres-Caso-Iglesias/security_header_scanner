# Frontend: React + Vite

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
| TypeScript | 5 | Tipado |
| CSS | puro | Sin frameworks externos |

## Estructura

```
frontend/
├── index.html              # HTML base
├── vite.config.ts          # Configuracion Vite + proxy
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx            # Entry point (ReactDOM.createRoot)
│   ├── index.css           # Reset minimo
│   ├── App.tsx             # Componente principal
│   └── App.css             # Todos los estilos
└── dist/                   # Build de produccion
```

## Componentes

La aplicacion es un SPA de un solo componente (`App.tsx`) con los siguientes elementos funcionales:

### ScanForm

Formulario de entrada compuesto por:
- Input de texto con placeholder "https://ejemplo.com"
- Boton "Escanear"
- Soporte para tecla Enter
- Estado disabled durante la carga

### ScoreCircle

Componente que renderiza un grafico circular SVG con:
- Circulo de fondo gris oscuro
- Arco de progreso coloreado segun el grado (A=verde, B=verde claro, C=amarillo, D=naranja, E=rojo, F=rojo oscuro)
- Texto central con el grado (letra grande) y el score numerico
- Animacion de transicion en el arco (1s ease-in-out)

Colores por grado:
```typescript
const gradeColors = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  E: '#ef4444',
  F: '#dc2626',
}
```

### ScoreHeader

Barra superior centrada con:
- ScoreCircle (izquierda)
- Metadatos del scan en grilla 2x2: URL, status code, tiempo de respuesta, headers analizados, TLS, recomendaciones
- Contenido con max-width de 960px y centrado

### HeaderGrid

Grilla de 3 columnas (2 en mobile) con tarjetas de headers. Cada tarjeta contiene:
- Nombre del header (monospace)
- Icono de estado (OK/Regular/AUSENTE) coloreado por severidad
- Barra de progreso horizontal animada (0-100%)
- Badge de severidad (critical/high/medium/low)
- Valor numerico del grade
- Texto del hallazgo
- Texto de la recomendacion

Las tarjetas tienen un borde izquierdo de 3px coloreado por severidad:
- critical: rojo (#dc2626)
- high: naranja (#f97316)
- medium: amarillo (#eab308)
- low: verde (#22c55e)

### ComplianceSection

Aparece en la columna derecha (1/3 del ancho) junto a los headers. Incluye:
- Nombre del control
- Status coloreado (compliant=verde, partially_compliant=amarillo, non_compliant=rojo, not_applicable=gris)
- Descripcion del hallazgo
- Recomendacion
- Headers relacionados (si aplica)

### TLS Section

Dos tarjetas en grilla de 2 columnas (dentro de una fila 50/50 junto a DNS):
- Conexion: version TLS, host, puerto, grade
- Certificado: sujeto, emisor, validez, self-signed, wildcard, SAN

### SSL Expiration Warning

Banner prominente debajo del resumen del scan que aparece cuando el certificado SSL:
- Ha expirado: fondo rojo con mensaje "CERTIFICADO EXPIRADO"
- Expira en menos de 30 dias: fondo naranja con cuenta regresiva

### Security Files Section

Dos tarjetas en grilla de 2 columnas:
- `/.well-known/security.txt`: Muestra si existe, su contenido y analisis de campos RFC 9116
- `/robots.txt`: Muestra si existe, su contenido y deteccion de rutas sensibles

### DNS Section

Tres tarjetas en columna (dentro de una fila 50/50 junto a TLS):
- SPF: Registro TXT del dominio, analiza mecanismo all e include
- DKIM: Registro TXT en `{selector}._domainkey.{domain}` con clave publica
- DMARC: Registro TXT en `_dmarc.{domain}` con politica y reporting

### RecommendationsList

Lista de recomendaciones ordenadas por severidad, cada una con formato `[SEVERIDAD] texto`.

### ExportButtons

Barra de botones centrada debajo del ScoreHeader:
- Copiar JSON: copia el reporte al portapapeles
- Descargar JSON: descarga el reporte como archivo .json
- Descargar PDF: genera y descarga un documento PDF profesional

## Layout de Resultados

La seccion de resultados utiliza un layout de ancho completo:

```
+------------------------------------------------------------+
|  .results (width: 100vw, centrado con calc(-50vw + 50%))   |
|                                                             |
|  +---------------------------+----------------------------+ |
|  |  .result-header           |  (max-width: 960px, cent.) | |
|  |  [ScoreCircle] [Meta]     |                            | |
|  +---------------------------+----------------------------+ |
|                                                             |
|  +---------------------------+----------------------------+ |
|  |  .export-buttons          |  (max-width: 960px, cent.) | |
|  |  [Copiar] [JSON] [PDF]    |                            | |
|  +---------------------------+----------------------------+ |
|                                                             |
|  +----------------------------+----------------------------+ |
|  |  .column-main (flex: 2)    | .column-side (flex: 1)     | |
|  |  Headers de Seguridad      | Cumplimiento Normativo     | |
|  |  3 tarjetas por fila       | OWASP + NIS2              | |
|  +----------------------------+----------------------------+ |
|  |  Security Files (1/2)      | Security Files (1/2)       | |
|  |  security.txt              | robots.txt                 | |
|  +----------------------------+----------------------------+ |
|  |  TLS / SSL (col-half)      | DNS / Email (col-half)    | |
|  |  Conexion + Certificado    | SPF + DKIM + DMARC        | |
|  +----------------------------+----------------------------+ |
|                                                             |
|  +--------------------------------------------------------+ |
|  |  Recomendaciones (full-width, 4 columnas)                | |
|  |  CRITICAL | HIGH | MEDIUM | LOW                         | |
|  +--------------------------------------------------------+ |
+------------------------------------------------------------+
```

En mobile (<768px), las columnas de headers y compliance se apilan verticalmente, y la grilla de headers pasa a 2 columnas.

## Exportacion de Reportes

El frontend provee 3 mecanismos de exportacion:

| Boton | Formato | Metodo |
|-------|---------|--------|
| Copiar JSON | text/plain | navigator.clipboard.writeText() |
| Descargar JSON | .json file | fetch + Blob + download link |
| Descargar PDF | .pdf file | fetch + Blob + download link |

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
- Input de URL vacio
- Boton deshabilitado hasta que se ingrese texto

### Estado de carga
- Input deshabilitado
- Boton muestra animacion de spinner
- Barra de progreso animada debajo

### Estado de exito
- Animacion fade-in del reporte
- ScoreCircle con el resultado
- HeaderGrid con los 15 headers (3 por fila)
- Columns layout: headers (2/3) + compliance (1/3)
- TLS section con certificado
- Recommendations list
- Botones de exportacion

### Estado de error
- Banner rojo con mensaje de error
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

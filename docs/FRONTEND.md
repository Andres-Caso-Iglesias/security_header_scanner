# Frontend: React + Vite

Documentacion tecnica del frontend de la herramienta de auditoria de seguridad web.

## Tabla de Contenidos

- [Stack](#stack)
- [Estructura](#estructura)
- [Componentes](#componentes)
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
  A: '#22c55e',  // verde
  B: '#84cc16',  // verde claro
  C: '#eab308',  // amarillo
  D: '#f97316',  // naranja
  E: '#ef4444',  // rojo
  F: '#dc2626',  // rojo oscuro
}
```

### ScoreHeader

Barra superior con:
- ScoreCircle (izquierda)
- Metadatos del scan en grilla 2x2: URL, status code, tiempo de respuesta, headers analizados, recomendaciones
- Boton "Copiar Reporte" (copia el JSON completo al portapapeles con feedback visual)

### HeaderGrid

Grilla responsiva de tarjetas (auto-fill, min 280px cada una). Cada tarjeta contiene:

- Nombre del header (monospace)
- Icono de estado (check/advertencia/equis) coloreado por severidad
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

Dos secciones (OWASP Top 10 + NIS2) con tarjetas de cumplimiento. Cada tarjeta incluye:

- Nombre del control
- Status coloreado (compliant=verde, partially_compliant=amarillo, non_compliant=rojo, not_applicable=gris)
- Descripcion del hallazgo
- Recomendacion
- Headers relacionados (si aplica)

### RecommendationsList

Lista de recomendaciones ordenadas por severidad, cada una con formato `[SEVERIDAD] texto`.

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

De esta forma no hay problemas de CORS durante el desarrollo.

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
- HeaderGrid con los 15 headers
- Compliance sections
- Recommendations list

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

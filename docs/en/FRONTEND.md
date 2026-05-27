# Frontend: Security Header Scanner & Quick Assessment Tool

> **ACADEMIC PROJECT** — This tool was developed as a Master's project in Cybersecurity.
> Results are indicative. Do not use as the sole instrument for professional auditing.

Technical documentation of the frontend for the Security Header Scanner & Quick Assessment Tool.

## Table of Contents

- [Stack](#stack)
- [Structure](#estructura)
- [Components](#componentes)
- [Results Layout](#layout-de-resultados)
- [Report Export](#exportacion-de-reportes)
- [Proxy and Backend Communication](#proxy-y-comunicacion-con-backend)
- [UI States](#estados-de-la-ui)
- [Build and Deploy](#build-y-deploy)

## Stack

| Technology | Version | Use |
|------------|---------|-----|
| React | 19 | UI Library |
| Vite | 8 | Bundler and dev server |
| TypeScript | 6 | Typing |
| Tailwind CSS | 4 | Styles (utility-first) |
| Chart.js | 4 | Charts (DNS and SRI donut) |
| Vitest | 3 | Unit testing |
| React Testing Library | 16 | Component testing |

## Structure

```
frontend/
├── index.html              # Base HTML (with Inter font)
├── vite.config.ts          # Vite config + Tailwind plugin + proxy
├── vitest.config.ts        # Vitest config (jsdom, setup)
├── nginx.conf              # Nginx config for Docker
├── Dockerfile              # Multi-stage build + Nginx
├── package.json
├── src/
│   ├── main.tsx            # Entry point (ReactDOM.createRoot)
│   ├── index.css           # Tailwind import + theme + animations
│   ├── App.tsx             # Main orchestrator (~98 lines)
│   ├── types.ts            # Domain interfaces (MIRROR + FRONTEND-ONLY)
│   ├── hooks/
│   │   ├── useScan.ts      # Scan logic: state, handleScan, error classification, SSE
│   │   └── useTabs.ts      # Dashboard tabs management
│   ├── lib/
│   │   └── cn.ts           # clsx + tailwind-merge utility
│   ├── test/
│   │   ├── setup.ts        # Testing config (@testing-library/jest-dom)
│   │   ├── mock-data.ts    # Mock data for tests
│   │   └── components/     # Tests with Vitest + RTL
│   └── components/         # Organized by feature
│       ├── layout/
│       │   └── ErrorBoundary.tsx
│       ├── scan/
│       │   ├── ScanForm.tsx
│       │   └── ScanProgress.tsx
│       └── results/
│           ├── index.ts            # Barrel export
│           ├── ScoreCircle.tsx
│           ├── HeaderGrid.tsx
│           ├── MetaSection.tsx
│           ├── SslWarning.tsx
│           ├── TlsSection.tsx
│           ├── DnsSection.tsx
│           ├── SriSection.tsx
│           ├── FingerprintSection.tsx
│           ├── SensitiveSection.tsx
│           ├── SecurityFilesSection.tsx
│           ├── RecommendationsSection.tsx
│           ├── ComplianceGrid.tsx
│           └── HistoryPanel.tsx
└── dist/                   # Production build
```

## Components

The application organizes components by feature under `src/components/`, with the main orchestrator `App.tsx` (~98 lines) delegating all logic to custom hooks.

### Custom Hooks

**`useScan`** — Encapsulates all scan logic:
- State: `url`, `loading`, `progress`, `results`, `error`
- `handleScan()`: connects to SSE endpoint (`/api/scan/stream`) via `EventSource` to receive real-time progress
- Error classification (network, timeout, server, validation)
- 30s timeout as safety fallback
- `selectHistory()`: loads a previous scan from history

**`useTabs`** — Manages dashboard tabs:
- State: `activeTab`, `setActiveTab`
- Definition of available tabs

### Layout Components

Renders an animated circular SVG chart with:
- Background circle
- Colored progress arc based on grade (A-F)
- Centered SVG text: grade letter + numeric score
- Subtitle "SECURITY SCORE" below chart with **informative tooltip** (icon `?`) explaining score calculation formula and limitations

### ComplianceGrid

Four cards in a row (OWASP, NIS2, ENS, ISO 27001), each with score, status dots, and findings list.
Includes a **disclaimer banner** at the start warning: "Automatic mapping based only on headers. Does not replace a formal audit."

### ScanProgress

Progressive loading component showing real-time status of each scan stage via **SSE (Server-Sent Events)**:
- Animated progress bar with percentage based on real server events
- List of 9 stages with visual indicator: pending (circle), scanning (spinner SVG), completed (checkmark)
- Contextual message describing current operation (provided by server)
- Automatic transition to results when scan finishes

> **Note:** Progress is REAL — consumes `/api/scan/stream` endpoint via `EventSource`. No simulated timeouts used.

### ErrorBoundary

Wrapper that catches render errors in child components. Each dashboard tab is wrapped in its own ErrorBoundary:
- Shows specific error message for failed section
- "Retry" button resets state
- Other tabs continue functioning without interruption
- Implemented as React class (componentDidCatch)

### HistoryPanel

Sidebar panel showing scan history stored in backend (SQLite):

- List of scans with URL, score, grade, and timestamp
- "Load" button restores selected scan results
- "Delete" button removes scan from history
- Integrated via `GET /api/history`, `GET /api/history/:id`, `DELETE /api/history/:id`

### Error States

Application handles a `ScanError` type with 4 categories:

| Type | Meaning | Action |
|------|---------|--------|
| `network` | Connection error to backend | Retry |
| `timeout` | Scan exceeded time limit | Retry with faster URL |
| `server` | Internal server error (502, 5xx) | Retry later |
| `validation` | Invalid or malformed URL | Correct URL |

Each dashboard tab is wrapped in its own `ErrorBoundary` (React class with `componentDidCatch`) showing specific message and "Retry" button without affecting other tabs.

### SecurityFilesSection

## Results Layout

Results section uses tabs to organize information:

```
+------------------------------------------------------------+
|  [ScoreCircle]  [URL]                                       |
|                  [HTTP Status] [Time] [Headers] [TLS][DNS]|
|                  [Download JSON] [Download PDF]           |
+------------------------------------------------------------+
|  [SSL Warning - if applicable]                            |
+------------------------------------------------------------+
|  Headers | Compliance | TLS/SSL | DNS | SRI | ...        |
+------------------------------------------------------------+
|  Active tab content                                        |
+------------------------------------------------------------+
|  Security Files (always visible)                          |
+------------------------------------------------------------+
|  Footer                                                    |
+------------------------------------------------------------+
```

## Report Export

Frontend provides 2 export mechanisms via `POST /api/export`:

| Button | Format | Behavior |
|--------|--------|----------|
| Download JSON | .json | fetch → Blob → download link |
| Download PDF | .pdf | fetch → Blob → download link |

Both call `POST /api/export` endpoint with corresponding format.

## Proxy and Backend Communication

In development, Vite redirects `/api/*` requests to NestJS backend:

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

Frontend calls API using relative fetch:

```typescript
const res = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url }),
});
```

This avoids CORS issues during development. Proxy also works for `/api/export` endpoint.

## UI States

Application manages 4 visual states:

### Initial State
- Header with title and description
- URL input + "Scan" button
- Informational pills (15+ headers, TLS/DNS, compliance)

### Loading State
- Skeleton loaders (circle + animated rectangles)
- Disabled input
- Button with spinner SVG

### Success State
- ScoreCircle with animated arc
- SSL Warning (if applicable)
- Tabs: Headers, Compliance, TLS/SSL, DNS, SRI, Fingerprinting, Sensitives, Recommendations
- Active tab content
- Security Files (always visible)
- Functional export buttons

### Error State
- Red banner with error message
- Form remains interactive for retry

## Build and Deploy

### Development

```bash
cd frontend
npm run dev
```

Starts server at http://localhost:5173 with HMR.

### Production

```bash
cd frontend
npm run build
```

Generates static files in `dist/`:
- `dist/index.html`
- `dist/assets/index-*.css`
- `dist/assets/index-*.js`

### Integrated Deploy with NestJS

To serve frontend from NestJS in production:

1. Build frontend: `cd frontend && npm run build`
2. Configure NestJS to serve static files from `frontend/dist/`
3. Access application via NestJS port (3000)
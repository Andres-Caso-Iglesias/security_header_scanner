#!/bin/bash
# ============================================================
# Start script — Security Header Scanner & Quick Assessment Tool
# ============================================================
# Usage:
#   ./start.sh              # Start both backend and frontend
#   ./start.sh backend      # Start only backend
#   ./start.sh frontend     # Start only frontend
#   ./start.sh build        # Build both and start
#
# Environment variables:
#   API_KEY=secret          # Enable API key authentication
#   RATE_LIMIT_MAX=10       # Max requests per window
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

start_backend() {
  log "Instalando dependencias del backend..."
  cd "$(dirname "$0")"
  npm install --silent
  
  log "Construyendo backend..."
  npm run build
  
  log "Iniciando backend en puerto ${BACKEND_PORT:-3000}..."
  API_KEY="${API_KEY:-}" \
  RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-20}" \
  RATE_LIMIT_WINDOW_MS="${RATE_LIMIT_WINDOW_MS:-60000}" \
  node dist/main.js &
  BACKEND_PID=$!
  
  log "Backend corriendo (PID: $BACKEND_PID)"
}

start_frontend() {
  log "Instalando dependencias del frontend..."
  cd "$(dirname "$0")/frontend"
  npm install --silent
  
  log "Iniciando frontend en puerto 5173..."
  npm run dev &
  FRONTEND_PID=$!
  
  log "Frontend corriendo (PID: $FRONTEND_PID)"
}

build_frontend() {
  log "Construyendo frontend para producción..."
  cd "$(dirname "$0")/frontend"
  npm install --silent
  npm run build
  log "Frontend construido en frontend/dist/"
}

case "${1:-all}" in
  backend)
    start_backend
    wait
    ;;
  frontend)
    start_frontend  
    wait
    ;;
  build)
    cd "$(dirname "$0")"
    npm install --silent
    npm run build
    build_frontend
    log "Build completado."
    ;;
  all)
    info "Iniciando backend y frontend..."
    start_backend
    start_frontend
    info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    info " Backend:  http://localhost:${BACKEND_PORT:-3000}"
    info " Frontend: http://localhost:5173"
    info " Swagger:  http://localhost:3000/api/docs"
    info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    info "Presiona Ctrl+C para detener ambos servicios"
    wait
    ;;
  *)
    echo "Uso: $0 {backend|frontend|build|all}"
    exit 1
    ;;
esac

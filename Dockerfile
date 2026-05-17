# ============================================================
# Dockerfile — Backend (NestJS)
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# rxjs 7.8.1 npm package ships without .d.ts files in dist/types.
# Download and extract the real type declarations from the official package.
RUN npm pack rxjs@7.8.1 --pack-destination /tmp && \
    mkdir -p /tmp/rxjs-types && \
    tar -xzf /tmp/rxjs-7.8.1.tgz -C /tmp/rxjs-types && \
    cp -r /tmp/rxjs-types/package/dist/types/* node_modules/rxjs/dist/types/ && \
    rm -rf /tmp/rxjs-7.8.1.tgz /tmp/rxjs-types

# Copy source
COPY tsconfig*.json ./
COPY src/ ./src/

# Build
RUN npm run build

# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

CMD ["node", "dist/main.js"]

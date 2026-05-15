# ============================================================
# Dockerfile — Backend (NestJS)
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Workaround: create missing rxjs type declarations
# rxjs 7.8.1 is published without dist/types/index.d.ts
RUN mkdir -p node_modules/rxjs/dist/types && \
    echo 'export class Observable<T> { constructor(subscribe?: (subscriber: any) => void); pipe<R>(...operations: ((source: Observable<any>) => Observable<any>)[]): Observable<R>; subscribe(observer?: any): any; }' > node_modules/rxjs/dist/types/index.d.ts && \
    echo 'export class Subject<T> extends Observable<T> { next(value: T): void; error(err: any): void; complete(): void; asObservable(): Observable<T>; }' >> node_modules/rxjs/dist/types/index.d.ts && \
    echo 'export function firstValueFrom<T>(source: Observable<T>): Promise<T>;' >> node_modules/rxjs/dist/types/index.d.ts && \
    echo 'export function from<T>(input: any): Observable<T>;' >> node_modules/rxjs/dist/types/index.d.ts && \
    echo 'export function of<T>(...values: T[]): Observable<T>;' >> node_modules/rxjs/dist/types/index.d.ts && \
    echo 'export function map<T, R>(project: (value: T, index: number) => R): (source: Observable<T>) => Observable<R>;' >> node_modules/rxjs/dist/types/index.d.ts

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

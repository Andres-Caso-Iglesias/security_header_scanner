/**
 * CORS configuration.
 *
 * In development, the frontend (Vite on port 5173) proxies API requests,
 * so CORS is not needed for the Vite dev workflow.
 *
 * However, if the backend is deployed standalone (without the nginx proxy
 * that ships with the Docker Compose setup), the browser will block
 * cross-origin requests from a different frontend domain.
 *
 * Configure via CORS_ORIGIN env var:
 *   CORS_ORIGIN=https://miapp.com    # single specific origin
 *   CORS_ORIGIN=*                     # allow any origin (dev only)
 *   CORS_ORIGIN=                      # empty = no CORS headers
 *
 * Default: http://localhost:5173 (Vite dev server origin)
 */
export const CORS_CONFIG = (() => {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  if (!raw) {
    return false; // No CORS
  }

  return {
    origin: raw === '*' ? true : raw,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
    credentials: true,
    maxAge: 86400,
  };
})();

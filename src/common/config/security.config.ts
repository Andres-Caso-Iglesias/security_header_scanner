/**
 * Security configuration read from environment variables.
 */
export const SECURITY = {
  /** API key required to call /api/scan and /api/export. If empty, auth is disabled. */
  API_KEY: process.env.API_KEY || '',

  /** Rate limiting: max requests per window per IP */
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '20', 10),

  /** Rate limiting: window in milliseconds (default: 1 minute) */
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
} as const;

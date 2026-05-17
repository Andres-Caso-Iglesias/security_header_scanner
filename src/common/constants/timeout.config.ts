/**
 * Timeout configuration per subsystem.
 * Each value can be overridden via environment variables.
 * Values are in milliseconds.
 */
export const TIMEOUTS = {
  /** Global HTTP client (Axios module) */
  HTTP_CLIENT: parseInt(process.env.TIMEOUT_HTTP_CLIENT ?? '10000', 10),

  /** Full page fetch for HTML content (fingerprinting, SRI) */
  PAGE_FETCH: parseInt(process.env.TIMEOUT_PAGE_FETCH ?? '8000', 10),

  /** TLS/SSL socket connection */
  TLS: parseInt(process.env.TIMEOUT_TLS ?? '8000', 10),

  /** DNS queries (SPF, DKIM, DMARC) */
  DNS: parseInt(process.env.TIMEOUT_DNS ?? '5000', 10),

  /** Security files (security.txt, robots.txt) */
  SECURITY_FILE: parseInt(process.env.TIMEOUT_SECURITY_FILE ?? '5000', 10),

  /** Sensitive files scan (per-file) */
  SENSITIVE_FILE: parseInt(process.env.TIMEOUT_SENSITIVE_FILE ?? '4000', 10),

  /** SRI HTML fetch */
  SRI: parseInt(process.env.TIMEOUT_SRI ?? '10000', 10),

  /** OSV.dev CVE API query */
  CVE_API: parseInt(process.env.TIMEOUT_CVE_API ?? '8000', 10),
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;

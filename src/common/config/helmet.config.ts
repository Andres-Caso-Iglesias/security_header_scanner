import type { HelmetOptions } from 'helmet';

/**
 * Helmet security headers configuration.
 *
 * CSP is disabled to allow Swagger UI (inline scripts/styles from CDN).
 * All other security headers are enabled at their default strict values.
 */
export const HELMET_CONFIG: HelmetOptions = {
  contentSecurityPolicy: false,
};

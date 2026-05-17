import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  BACKEND_PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_PORT: z.coerce.number().int().positive().default(5173),
  API_KEY: z.string().default(''),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DB_PATH: z.string().default('data/scans.db'),
  TIMEOUT_HTTP_CLIENT: z.coerce.number().int().positive().default(10000),
  TIMEOUT_PAGE_FETCH: z.coerce.number().int().positive().default(8000),
  TIMEOUT_TLS: z.coerce.number().int().positive().default(8000),
  TIMEOUT_DNS: z.coerce.number().int().positive().default(5000),
  TIMEOUT_SECURITY_FILE: z.coerce.number().int().positive().default(5000),
  TIMEOUT_SENSITIVE_FILE: z.coerce.number().int().positive().default(4000),
  TIMEOUT_SRI: z.coerce.number().int().positive().default(10000),
  TIMEOUT_CVE_API: z.coerce.number().int().positive().default(8000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

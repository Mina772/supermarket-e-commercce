import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Strongly-typed, validated environment configuration.
 * Fails fast at boot if a required variable is missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_URI_TEST: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET too short'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET too short'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  COOKIE_SECRET: z.string().default('cookie_secret'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(5),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('no-reply@supermarket.local'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:3000'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@supermarket.local'),
  SEED_ADMIN_PASSWORD: z.string().min(6).default('Admin@12345'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See errors above.');
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  maxUploadBytes: raw.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
} as const;

export type Env = typeof env;

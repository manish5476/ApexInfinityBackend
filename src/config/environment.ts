import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables before validation
dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017'),
  MONGODB_DB_NAME: z.string().default('apex_framework'),
  MONGODB_MAX_POOL_SIZE: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),

  // Cache & Redis
  REDIS_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth & Security
  JWT_SECRET: z.string().min(16).default('development_secret_key_at_least_16_chars_long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16)
    .default('development_refresh_secret_at_least_16_chars'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('90d'),
  FRONTEND_URL: z.string().default('http://localhost:4200'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4200,http://localhost:3000')
    .transform((val) => val.split(',').map((o) => o.trim()).filter(Boolean)),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),

  // Request Timeout
  REQUEST_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

export function validateEnvironment(customEnv?: Record<string, unknown>): EnvironmentConfig {
  const envToValidate = customEnv || process.env;
  const result = environmentSchema.safeParse(envToValidate);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    console.error('====================================================');
    console.error('CRITICAL CONFIGURATION ERROR: Invalid Environment');
    console.error('====================================================');
    console.error(formattedErrors);
    console.error('====================================================');

    throw new Error(`Invalid application environment configuration:\n${formattedErrors}`);
  }

  return result.data;
}

// Lazy-validated singleton configuration
let configInstance: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (!configInstance) {
    configInstance = validateEnvironment();
  }
  return configInstance;
}

export function resetConfigForTesting(overrides?: Record<string, unknown>): EnvironmentConfig {
  configInstance = validateEnvironment(overrides);
  return configInstance;
}

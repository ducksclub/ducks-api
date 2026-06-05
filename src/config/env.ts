import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  ENABLE_JOBS: z.coerce.boolean().default(false),

  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_API_URL: z.string().url().optional(),
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  TELEGRAM_BOT_USERNAME: z.string().min(1),

  MAILTRAP_TOKEN: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
})

export const env = envSchema.parse(process.env)

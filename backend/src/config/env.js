import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variables schema validation using Zod
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default('*'),
});

// Validate environment variables
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envVars.error.format(), null, 2));
  process.exit(1);
}

export const env = envVars.data;

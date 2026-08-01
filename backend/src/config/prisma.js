import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Reusable Prisma Client instance
 */
const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;

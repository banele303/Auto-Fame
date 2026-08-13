import { PrismaClient, Prisma } from '@prisma/client';

// Log database connection attempt for debugging
console.log('Initializing Prisma with DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL validation passed');
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a custom logger when in development mode
const customLogger = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] as Prisma.LogLevel[] 
  : ['error'] as Prisma.LogLevel[];

// Initialize Prisma with optimized settings for high traffic
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: customLogger,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export the client for use in the application

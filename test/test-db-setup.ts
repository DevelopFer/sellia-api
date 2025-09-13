import { PrismaClient } from '../generated/prisma';

// Global test database instance
let prisma: PrismaClient;

/**
 * Initialize the test database connection
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'mongodb://localhost:27017/sellia_test',
        },
      },
    });
    
    // Connect to the database
    await prisma.$connect();
  }
  
  return prisma;
}

/**
 * Clean up the test database - remove all data
 * Note: Using a simple approach that works with free MongoDB
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (prisma) {
    try {
      // Find all users and delete them one by one to avoid transaction issues
      const users = await prisma.user.findMany();
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch (error) {
      // If there's an error, it's likely because there are no users to delete
      console.log('Cleanup note:', error instanceof Error ? error.message : 'No users to clean up');
    }
  }
}

/**
 * Close the database connection
 */
export async function teardownTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null as any;
  }
}

/**
 * Get the current Prisma instance for tests
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
}
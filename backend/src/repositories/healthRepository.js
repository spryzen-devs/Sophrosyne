import prisma from '../config/prisma.js';

/**
 * Health Repository
 */
class HealthRepository {
  /**
   * Check database connectivity
   * @returns {Promise<boolean>}
   */
  async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database Connection Error:', error);
      return false;
    }
  }
}

export default new HealthRepository();

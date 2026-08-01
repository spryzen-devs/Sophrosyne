import healthRepository from '../repositories/healthRepository.js';

/**
 * Health Service
 */
class HealthService {
  /**
   * Get health status of the application
   * @returns {Promise<Object>}
   */
  async getHealthStatus() {
    const isDbConnected = await healthRepository.checkDatabase();
    
    return {
      success: true,
      message: 'Sentinel Backend Running',
      database: isDbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

export default new HealthService();

import healthService from '../services/healthService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health Controller
 */
class HealthController {
  /**
   * Handle health check request
   */
  checkHealth = asyncHandler(async (req, res) => {
    const healthStatus = await healthService.getHealthStatus();
    
    const statusCode = healthStatus.database === 'Connected' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  });
}

export default new HealthController();

import { Router } from 'express';
import healthController from '../controllers/healthController.js';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Check API and Database health
 * @access Public
 */
router.get('/health', healthController.checkHealth);

export default router;

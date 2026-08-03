import express from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Dashboard Routes
 */

// All dashboard routes require authentication
router.use(protect);

// GET /api/v1/dashboard/overview - Only ADMIN and DOCTOR
router.get(
  '/overview',
  authorize('ADMIN', 'DOCTOR'),
  dashboardController.getOverview
);

// GET /api/v1/dashboard/recent-alerts - Only ADMIN and DOCTOR
router.get(
  '/recent-alerts',
  authorize('ADMIN', 'DOCTOR'),
  dashboardController.getRecentAlerts
);

// GET /api/v1/dashboard/live-patients - Only ADMIN and DOCTOR
router.get(
  '/live-patients',
  authorize('ADMIN', 'DOCTOR'),
  dashboardController.getLivePatients
);

// GET /api/v1/dashboard/device-status - ADMIN, DOCTOR, and TECHNICIAN
router.get(
  '/device-status',
  authorize('ADMIN', 'DOCTOR', 'TECHNICIAN'),
  dashboardController.getDeviceStatus
);

export default router;

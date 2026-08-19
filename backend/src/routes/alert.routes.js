import express from 'express';
import alertController from '../controllers/alert.controller.js';
import { protect, authorize, validate } from '../middleware/auth.middleware.js';
import { getAlertsQuerySchema } from '../validators/alert.validator.js';

const router = express.Router();

/**
 * Alert Routes
 */

// All alert routes require authentication
router.use(protect);

// GET /api/v1/alerts - Get all alerts
router.get('/', validate(getAlertsQuerySchema), alertController.getAllAlerts);

// GET /api/v1/alerts/active - Get active alerts
router.get('/active', validate(getAlertsQuerySchema), alertController.getActiveAlerts);

// GET /api/v1/alerts/:id - Get alert by ID
router.get('/:id', alertController.getAlertById);

// GET /api/v1/alerts/patient/:patientId - Get alerts for a patient
router.get('/patient/:patientId', validate(getAlertsQuerySchema), alertController.getPatientAlerts);

// PATCH /api/v1/alerts/:id/resolve - Resolve alert (Only DOCTOR)
router.patch('/:id/resolve', authorize('DOCTOR'), alertController.resolveAlert);

export default router;

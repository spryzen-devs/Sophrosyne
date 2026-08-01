import express from 'express';
import telemetryController from '../controllers/telemetry.controller.js';
import { protect, validate } from '../middleware/auth.middleware.js';
import {
  recordTelemetrySchema,
  getTelemetryQuerySchema,
} from '../validators/telemetry.validator.js';

const router = express.Router();

/**
 * Telemetry Routes
 */

// POST /api/v1/telemetry - Record telemetry (Devices usually send this, could be unauthenticated or use a device token, but based on prompt we use layered architecture and standard middleware if not specified otherwise. Prompt doesn't specify special auth for this, so we'll use protect for consistency or allow it if it's purely for device ingestion. However, typically these endpoints are protected.)
// The prompt says "Generate ONLY the Telemetry Module" and "Use the existing layered architecture".
// It doesn't explicitly say to protect the POST endpoint, but usually all endpoints in this backend are protected.
router.post('/', validate(recordTelemetrySchema), telemetryController.recordTelemetry);

// All following routes require authentication
router.use(protect);

// GET /api/v1/telemetry - Get all telemetry (Search & Pagination)
router.get('/', validate(getTelemetryQuerySchema), telemetryController.getAllTelemetry);

// GET /api/v1/telemetry/:deviceId - Get telemetry by device ID
router.get('/:deviceId', validate(getTelemetryQuerySchema), telemetryController.getTelemetryByDeviceId);

// GET /api/v1/telemetry/latest/:deviceId - Get latest telemetry
router.get('/latest/:deviceId', telemetryController.getLatestTelemetry);

// GET /api/v1/telemetry/history/:deviceId - Get telemetry history
router.get('/history/:deviceId', validate(getTelemetryQuerySchema), telemetryController.getTelemetryHistory);

export default router;

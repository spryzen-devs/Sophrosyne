import express from 'express';
import deviceController from '../controllers/device.controller.js';
import { protect, authorize, validate } from '../middleware/auth.middleware.js';
import {
  createDeviceSchema,
  updateDeviceSchema,
  assignDeviceSchema,
  getDevicesQuerySchema,
} from '../validators/device.validator.js';

const router = express.Router();

/**
 * Device Routes
 */

// All routes require authentication
router.use(protect);

// GET /api/v1/devices - Get all devices (Search, Pagination, Sorting)
// Only ADMIN and DOCTOR can view devices
router.get(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  validate(getDevicesQuerySchema),
  deviceController.getAllDevices
);

// GET /api/v1/devices/:id - Get device by ID
router.get('/:id', authorize('ADMIN', 'DOCTOR'), deviceController.getDeviceById);

// POST /api/v1/devices - Register Device (Only ADMIN)
router.post(
  '/',
  authorize('ADMIN'),
  validate(createDeviceSchema),
  deviceController.registerDevice
);

// PUT /api/v1/devices/:id - Update device
// ADMIN and TECHNICIAN can update devices
// Technicians can only update firmwareVersion, batteryLevel, and lastSeen (handled via validator or controller logic)
router.put(
  '/:id',
  authorize('ADMIN', 'TECHNICIAN'),
  validate(updateDeviceSchema),
  deviceController.updateDevice
);

// DELETE /api/v1/devices/:id - Delete device (Only ADMIN)
router.delete('/:id', authorize('ADMIN'), deviceController.deleteDevice);

// PATCH /api/v1/devices/:id/assign - Assign to patient (Only ADMIN)
router.patch(
  '/:id/assign',
  authorize('ADMIN'),
  validate(assignDeviceSchema),
  deviceController.assignDevice
);

// PATCH /api/v1/devices/:id/unassign - Unassign from patient (Only ADMIN)
router.patch('/:id/unassign', authorize('ADMIN'), deviceController.unassignDevice);

export default router;

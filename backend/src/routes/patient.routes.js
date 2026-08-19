import express from 'express';
import patientController from '../controllers/patient.controller.js';
import { protect, authorize, validate } from '../middleware/auth.middleware.js';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientsQuerySchema,
} from '../validators/patient.validator.js';

const router = express.Router();

/**
 * Patient Routes
 */

// All routes require authentication
router.use(protect);

// GET /api/v1/patients - Get all patients (Search & Pagination)
router.get('/', validate(getPatientsQuerySchema), patientController.getAllPatients);

// GET /api/v1/patients/:id - Get patient by ID
router.get('/:id', patientController.getPatientById);

// POST /api/v1/patients - Create patient (Only ADMIN)
router.post(
  '/',
  authorize('ADMIN'),
  validate(createPatientSchema),
  patientController.createPatient
);

// PUT /api/v1/patients/:id - Update patient
router.put(
  '/:id',
  validate(updatePatientSchema),
  patientController.updatePatient
);

// DELETE /api/v1/patients/:id - Delete patient (Only ADMIN)
router.delete('/:id', authorize('ADMIN'), patientController.deletePatient);

export default router;

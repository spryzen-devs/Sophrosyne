import express from 'express';
import authController from '../controllers/auth.controller.js';
import { protect, authorize, validate } from '../middleware/auth.middleware.js';
import { registerSchema, registerDoctorSchema, loginSchema } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * Authentication & Doctor Management Routes
 */

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/doctors - Admin creates a new Doctor
router.post('/doctors', protect, authorize('ADMIN'), validate(registerDoctorSchema), authController.registerDoctor);

// GET /api/v1/auth/doctors - List all doctors (for assignment dropdown)
router.get('/doctors', protect, authController.getDoctors);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/me
router.get('/me', protect, authController.getMe);

export default router;

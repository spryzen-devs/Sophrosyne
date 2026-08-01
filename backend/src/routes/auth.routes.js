import express from 'express';
import authController from '../controllers/auth.controller.js';
import { protect, validate } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * Authentication Routes
 */

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/me
router.get('/me', protect, authController.getMe);

export default router;

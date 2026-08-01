import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

/**
 * Middleware Configuration
 */

// Security Headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request Logger
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes Configuration
 */

// API v1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);

// Root path
app.get('/', (req, res) => {
  res.json({ message: 'Sentinel Backend API Foundation' });
});

/**
 * Error Handling Middleware
 */

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;

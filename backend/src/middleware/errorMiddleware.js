import { env } from '../config/env.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  console.error(`[Error]: ${err.message}`);
  
  res.status(statusCode).json(response);
};

/**
 * 404 Route handler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

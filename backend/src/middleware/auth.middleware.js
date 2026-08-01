import jwtUtil from '../utils/jwt.js';

/**
 * Authentication Middleware
 */
export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwtUtil.verifyToken(token);
    
    if (!decoded) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 401;
      return next(error);
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role Authorization Middleware
 * @param {...string} roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error(`User role ${req.user?.role} is not authorized to access this route`);
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

/**
 * Request Validation Middleware
 * @param {ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const validationError = new Error(
      error.errors.map((err) => err.message).join(', ')
    );
    validationError.statusCode = 400;
    next(validationError);
  }
};

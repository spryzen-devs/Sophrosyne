import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT Utility Functions
 */
class JwtUtil {
  /**
   * Generate a JWT for a user
   * @param {Object} payload - User data (id, email, role)
   * @returns {string} - Signed JWT
   */
  generateToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '24h',
    });
  }

  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

export default new JwtUtil();

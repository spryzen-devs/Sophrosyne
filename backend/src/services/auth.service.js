import bcrypt from 'bcrypt';
import authRepository from '../repositories/auth.repository.js';
import jwtUtil from '../utils/jwt.js';

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async register(userData) {
    // Check if email already exists
    const existingUser = await authRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create user
    const newUser = await authRepository.createUser({
      ...userData,
      passwordHash,
    });

    return newUser;
  }

  /**
   * Login user and generate token
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    // Find user by email
    const user = await authRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT
    const token = jwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get current user profile
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getMe(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Get all registered doctors
   * @returns {Promise<Array>}
   */
  async getDoctors() {
    return authRepository.findDoctors();
  }
}

export default new AuthService();

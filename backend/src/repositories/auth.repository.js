import prisma from '../config/prisma.js';

/**
 * Authentication Repository
 */
class AuthRepository {
  /**
   * Find a user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create a new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    return prisma.user.create({
      data: {
        fullName: userData.fullName,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
        phone: userData.phone,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }

  /**
   * Find all users with DOCTOR role
   * @returns {Promise<Array>}
   */
  async findDoctors() {
    return prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }
}

export default new AuthRepository();

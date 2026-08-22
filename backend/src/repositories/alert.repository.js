import prisma from '../config/prisma.js';

/**
 * Alert Repository
 */
class AlertRepository {
  /**
   * Create a new alert
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.alert.create({
      data,
    });
  }

  /**
   * Find many alerts with filters and pagination
   * @param {Object} params
   * @returns {Promise<[Object[], number]>}
   */
  async findMany({ skip, take, where = {}, orderBy, currentUser }) {
    const finalWhere = { ...where };
    if (currentUser?.role === 'DOCTOR') {
      finalWhere.patient = {
        assignedDoctorId: currentUser.userId,
      };
    }

    const [data, total] = await Promise.all([
      prisma.alert.findMany({
        where: finalWhere,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              firstName: true,
              lastName: true,
            },
          },
          telemetry: true,
          resolver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.alert.count({ where: finalWhere }),
    ]);

    return [data, total];
  }

  /**
   * Find an alert by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        patient: true,
        telemetry: true,
        resolver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Update an alert (e.g., resolve it)
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.alert.update({
      where: { id },
      data,
    });
  }
}

export default new AlertRepository();

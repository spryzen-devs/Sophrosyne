import prisma from '../config/prisma.js';

/**
 * Patient Repository
 */
class PatientRepository {
  /**
   * Create a new patient
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.patient.create({
      data,
    });
  }

  /**
   * Find many patients with filters and pagination
   * @param {Object} params
   * @returns {Promise<[Object[], number]>}
   */
  async findMany({ skip, take, where }) {
    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return [data, total];
  }

  /**
   * Find a patient by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Update a patient by ID
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.patient.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a patient by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    return prisma.patient.delete({
      where: { id },
    });
  }

  /**
   * Get the last patient code to generate the next one
   * @returns {Promise<Object|null>}
   */
  async findLastPatient() {
    return prisma.patient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { patientCode: true },
    });
  }
}

export default new PatientRepository();

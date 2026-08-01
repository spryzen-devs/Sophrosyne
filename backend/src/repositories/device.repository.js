import prisma from '../config/prisma.js';

/**
 * Device Repository
 */
class DeviceRepository {
  /**
   * Create a new device
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.device.create({
      data,
    });
  }

  /**
   * Find many devices with filters, pagination and sorting
   * @param {Object} params
   * @returns {Promise<[Object[], number]>}
   */
  async findMany({ skip, take, where, orderBy }) {
    const [data, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientCode: true,
            },
          },
        },
      }),
      prisma.device.count({ where }),
    ]);

    return [data, total];
  }

  /**
   * Find a device by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.device.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientCode: true,
          },
        },
      },
    });
  }

  /**
   * Find a device by deviceCode
   * @param {string} deviceCode
   * @returns {Promise<Object|null>}
   */
  async findByCode(deviceCode) {
    return prisma.device.findUnique({
      where: { deviceCode },
    });
  }

  /**
   * Update a device by ID
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.device.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a device by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    return prisma.device.delete({
      where: { id },
    });
  }

  /**
   * Get the last device code to generate the next one
   * @returns {Promise<Object|null>}
   */
  async findLastDevice() {
    return prisma.device.findFirst({
      orderBy: { registeredAt: 'desc' },
      select: { deviceCode: true },
    });
  }

  /**
   * Check if a patient already has an assigned device
   * @param {string} patientId
   * @returns {Promise<Object|null>}
   */
  async findByPatientId(patientId) {
    return prisma.device.findFirst({
      where: { patientId },
    });
  }
}

export default new DeviceRepository();

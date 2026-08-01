import prisma from '../config/prisma.js';

/**
 * Telemetry Repository
 */
class TelemetryRepository {
  /**
   * Create a new telemetry record
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.telemetry.create({
      data,
    });
  }

  /**
   * Find many telemetry records with filters and pagination
   * @param {Object} params
   * @returns {Promise<[Object[], number]>}
   */
  async findMany({ skip, take, where, orderBy }) {
    const [data, total] = await Promise.all([
      prisma.telemetry.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { recordedAt: 'desc' },
        include: {
          device: {
            select: {
              deviceCode: true,
              status: true,
            },
          },
        },
      }),
      prisma.telemetry.count({ where }),
    ]);

    // Handle BigInt serialization if necessary (though usually handled by middleware or JSON.stringify)
    return [data, total];
  }

  /**
   * Find latest telemetry for a device
   * @param {string} deviceId
   * @returns {Promise<Object|null>}
   */
  async findLatestByDeviceId(deviceId) {
    return prisma.telemetry.findFirst({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
      include: {
        device: {
          select: {
            deviceCode: true,
          },
        },
      },
    });
  }

  /**
   * Find device by its code
   * @param {string} deviceCode
   * @returns {Promise<Object|null>}
   */
  async findDeviceByCode(deviceCode) {
    return prisma.device.findUnique({
      where: { deviceCode },
    });
  }
}

export default new TelemetryRepository();

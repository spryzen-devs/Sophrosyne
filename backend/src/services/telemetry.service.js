import telemetryRepository from '../repositories/telemetry.repository.js';
import alertService from './alert.service.js';
import notificationService from './notification.service.js';

/**
 * Telemetry Service
 */
class TelemetryService {
  /**
   * Record new telemetry
   * @param {Object} telemetryData
   * @returns {Promise<Object>}
   */
  async recordTelemetry(telemetryData) {
    const { deviceCode, ...metrics } = telemetryData;

    // Verify device exists
    const device = await telemetryRepository.findDeviceByCode(deviceCode);
    if (!device) {
      const error = new Error(`Device with code ${deviceCode} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Create telemetry record
    const telemetry = await telemetryRepository.create({
      ...metrics,
      deviceId: device.id,
      recordedAt: new Date(),
    });

    // Notify real-time clients
    if (device.patientId) {
      notificationService.notifyNewTelemetry(device.patientId, deviceCode, telemetry);
    }

    // Evaluate telemetry for alerts
    await alertService.evaluateTelemetry(telemetry);

    return telemetry;
  }

  /**
   * Get all telemetry with filters and pagination
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getAllTelemetry(query) {
    let { page = 1, limit = 10, deviceId, motionState, startDate, endDate } = query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (motionState) {
      where.motionState = motionState;
    }

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const [data, total] = await telemetryRepository.findMany({
      skip,
      take: limit,
      where,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get telemetry by device ID (with pagination)
   * @param {string} deviceId
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getTelemetryByDeviceId(deviceId, query) {
    return this.getAllTelemetry({ ...query, deviceId });
  }

  /**
   * Get latest telemetry for a device
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async getLatestTelemetry(deviceId) {
    const telemetry = await telemetryRepository.findLatestByDeviceId(deviceId);
    if (!telemetry) {
      const error = new Error('No telemetry found for this device');
      error.statusCode = 404;
      throw error;
    }
    return telemetry;
  }

  /**
   * Get historical telemetry for a device
   * @param {string} deviceId
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getTelemetryHistory(deviceId, query) {
    return this.getAllTelemetry({ ...query, deviceId });
  }
}

export default new TelemetryService();

import deviceRepository from '../repositories/device.repository.js';

/**
 * Device Service
 */
class DeviceService {
  /**
   * Register a new device
   * @param {Object} deviceData
   * @returns {Promise<Object>}
   */
  async registerDevice(deviceData) {
    let { deviceCode } = deviceData;

    // Generate unique deviceCode if not supplied
    if (!deviceCode) {
      deviceCode = await this._generateDeviceCode();
    } else {
      // Check if deviceCode already exists
      const existingDevice = await deviceRepository.findByCode(deviceCode);
      if (existingDevice) {
        const error = new Error('Device with this code already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    return deviceRepository.create({
      ...deviceData,
      deviceCode,
    });
  }

  /**
   * Get all devices with filters, pagination and sorting
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getAllDevices(query) {
    let {
      page = 1,
      limit = 10,
      search,
      deviceCode,
      status,
      patientId,
      sortBy = 'registeredAt',
      sortOrder = 'desc',
    } = query;

    // Ensure page and limit are numbers
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const skip = (page - 1) * limit;

    const where = {};

    if (deviceCode) {
      where.deviceCode = { contains: deviceCode, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        { deviceCode: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await deviceRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy,
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
   * Get device by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getDeviceById(id) {
    const device = await deviceRepository.findById(id);
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }
    return device;
  }

  /**
   * Update device
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateDevice(id, updateData) {
    await this.getDeviceById(id);

    const data = { ...updateData };
    if (data.lastSeen) {
      data.lastSeen = new Date(data.lastSeen);
    }

    return deviceRepository.update(id, data);
  }

  /**
   * Delete device
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async deleteDevice(id) {
    await this.getDeviceById(id);
    return deviceRepository.delete(id);
  }

  /**
   * Assign a device to a patient
   * @param {string} id - Device ID
   * @param {string} patientId
   * @returns {Promise<Object>}
   */
  async assignDevice(id, patientId) {
    const device = await this.getDeviceById(id);

    // Prevent assigning one device to multiple patients (if it's already assigned)
    if (device.patientId && device.patientId !== patientId) {
      const error = new Error('Device is already assigned to another patient');
      error.statusCode = 400;
      throw error;
    }

    // Check if patient already has a device (optional, but good practice based on "Prevent assigning one device to multiple patients" interpretation)
    const existingAssignment = await deviceRepository.findByPatientId(patientId);
    if (existingAssignment && existingAssignment.id !== id) {
      const error = new Error('Patient already has an assigned device');
      error.statusCode = 400;
      throw error;
    }

    return deviceRepository.update(id, { patientId });
  }

  /**
   * Unassign a device
   * @param {string} id - Device ID
   * @returns {Promise<Object>}
   */
  async unassignDevice(id) {
    await this.getDeviceById(id);
    return deviceRepository.update(id, { patientId: null });
  }

  /**
   * Private method to generate device code (e.g., DEV-0001)
   * @private
   */
  async _generateDeviceCode() {
    const lastDevice = await deviceRepository.findLastDevice();
    let nextNumber = 1;

    if (lastDevice && lastDevice.deviceCode) {
      const lastCode = lastDevice.deviceCode;
      const match = lastCode.match(/DEV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `DEV-${nextNumber.toString().padStart(4, '0')}`;
  }
}

export default new DeviceService();

import deviceService from '../services/device.service.js';

/**
 * Device Controller
 */
class DeviceController {
  /**
   * Register a new device
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async registerDevice(req, res, next) {
    try {
      const device = await deviceService.registerDevice(req.body);
      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all devices with filters, pagination and sorting
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getAllDevices(req, res, next) {
    try {
      const data = await deviceService.getAllDevices(req.query);
      res.status(200).json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get device by ID
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getDeviceById(req, res, next) {
    try {
      const device = await deviceService.getDeviceById(req.params.id);
      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update device
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async updateDevice(req, res, next) {
    try {
      const device = await deviceService.updateDevice(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Device updated successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete device
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async deleteDevice(req, res, next) {
    try {
      await deviceService.deleteDevice(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign a device to a patient
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async assignDevice(req, res, next) {
    try {
      const device = await deviceService.assignDevice(req.params.id, req.body.patientId);
      res.status(200).json({
        success: true,
        message: 'Device assigned to patient successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unassign a device from a patient
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async unassignDevice(req, res, next) {
    try {
      const device = await deviceService.unassignDevice(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Device unassigned successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DeviceController();

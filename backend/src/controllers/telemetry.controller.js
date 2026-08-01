import telemetryService from '../services/telemetry.service.js';

/**
 * Telemetry Controller
 */
class TelemetryController {
  /**
   * Record telemetry
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async recordTelemetry(req, res, next) {
    try {
      const telemetry = await telemetryService.recordTelemetry(req.body);
      
      // JSON.stringify bigints correctly if needed
      const response = JSON.parse(JSON.stringify(telemetry, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(201).json({
        success: true,
        message: 'Telemetry recorded successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all telemetry
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getAllTelemetry(req, res, next) {
    try {
      const data = await telemetryService.getAllTelemetry(req.query);
      
      const response = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get telemetry by device ID
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getTelemetryByDeviceId(req, res, next) {
    try {
      const data = await telemetryService.getTelemetryByDeviceId(req.params.deviceId, req.query);
      
      const response = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest telemetry for a device
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getLatestTelemetry(req, res, next) {
    try {
      const telemetry = await telemetryService.getLatestTelemetry(req.params.deviceId);
      
      const response = JSON.parse(JSON.stringify(telemetry, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get telemetry history for a device
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getTelemetryHistory(req, res, next) {
    try {
      const data = await telemetryService.getTelemetryHistory(req.params.deviceId, req.query);
      
      const response = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TelemetryController();

import alertService from '../services/alert.service.js';

/**
 * Alert Controller
 */
class AlertController {
  /**
   * Get all alerts
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getAllAlerts(req, res, next) {
    try {
      const data = await alertService.getAllAlerts(req.query, req.user);
      
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
   * Get active (unresolved) alerts
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getActiveAlerts(req, res, next) {
    try {
      const data = await alertService.getActiveAlerts(req.query, req.user);
      
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
   * Get alert by ID
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getAlertById(req, res, next) {
    try {
      const alert = await alertService.getAlertById(req.params.id);
      
      const response = JSON.parse(JSON.stringify(alert, (key, value) =>
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
   * Get patient alerts
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getPatientAlerts(req, res, next) {
    try {
      const data = await alertService.getPatientAlerts(req.params.patientId, req.query);
      
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
   * Resolve alert
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async resolveAlert(req, res, next) {
    try {
      const alert = await alertService.resolveAlert(req.params.id, req.user.userId);
      
      const response = JSON.parse(JSON.stringify(alert, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json({
        success: true,
        message: 'Alert resolved successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AlertController();

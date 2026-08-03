import dashboardService from '../services/dashboard.service.js';

/**
 * Dashboard Controller
 */
class DashboardController {
  /**
   * Get dashboard overview
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getOverview(req, res, next) {
    try {
      const data = await dashboardService.getOverview();
      res.status(200).json({
        success: true,
        message: 'Dashboard overview fetched successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent alerts
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getRecentAlerts(req, res, next) {
    try {
      const data = await dashboardService.getRecentAlerts();
      res.status(200).json({
        success: true,
        message: 'Recent alerts fetched successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get live patients
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getLivePatients(req, res, next) {
    try {
      const data = await dashboardService.getLivePatients();
      res.status(200).json({
        success: true,
        message: 'Live patients fetched successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get device status
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getDeviceStatus(req, res, next) {
    try {
      const data = await dashboardService.getDeviceStatus();
      res.status(200).json({
        success: true,
        message: 'Device status fetched successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();

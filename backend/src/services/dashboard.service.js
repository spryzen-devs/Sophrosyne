import dashboardRepository from '../repositories/dashboard.repository.js';

/**
 * Dashboard Service
 */
class DashboardService {
  /**
   * Get dashboard overview
   * @returns {Promise<Object>}
   */
  async getOverview(currentUser) {
    return dashboardRepository.getOverviewStats(currentUser);
  }

  /**
   * Get recent alerts
   * @param {number} limit
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getRecentAlerts(limit = 10, currentUser) {
    const alerts = await dashboardRepository.getRecentAlerts(limit, currentUser);
    
    return alerts.map(alert => ({
      alertId: alert.id,
      patientName: alert.patient ? `${alert.patient.firstName} ${alert.patient.lastName}` : 'N/A',
      deviceCode: alert.telemetry?.device?.deviceCode || 'N/A',
      severity: alert.severity,
      alertType: alert.alertType,
      message: alert.message,
      createdAt: alert.createdAt,
      resolved: alert.resolved
    }));
  }

  /**
   * Get live patients
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getLivePatients(currentUser) {
    return dashboardRepository.getLivePatients(currentUser);
  }

  /**
   * Get device status
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getDeviceStatus(currentUser) {
    return dashboardRepository.getDeviceStatus(currentUser);
  }
}

export default new DashboardService();

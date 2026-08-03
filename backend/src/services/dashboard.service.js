import dashboardRepository from '../repositories/dashboard.repository.js';

/**
 * Dashboard Service
 */
class DashboardService {
  /**
   * Get dashboard overview
   * @returns {Promise<Object>}
   */
  async getOverview() {
    return dashboardRepository.getOverviewStats();
  }

  /**
   * Get recent alerts
   * @returns {Promise<Array>}
   */
  async getRecentAlerts() {
    const alerts = await dashboardRepository.getRecentAlerts(10);
    
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
   * @returns {Promise<Array>}
   */
  async getLivePatients() {
    return dashboardRepository.getLivePatients();
  }

  /**
   * Get device status
   * @returns {Promise<Array>}
   */
  async getDeviceStatus() {
    return dashboardRepository.getDeviceStatus();
  }
}

export default new DashboardService();

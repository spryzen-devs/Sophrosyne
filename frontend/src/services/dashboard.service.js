import api from './api';

const dashboardService = {
  async getOverview() {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  async getRecentAlerts() {
    const response = await api.get('/dashboard/recent-alerts');
    return response.data;
  },

  async getLivePatients() {
    const response = await api.get('/dashboard/live-patients');
    return response.data;
  },

  async getDeviceStatus() {
    const response = await api.get('/dashboard/device-status');
    return response.data;
  },
};

export default dashboardService;

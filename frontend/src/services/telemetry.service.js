import api from './api';

const telemetryService = {
  async getAll(params = {}) {
    const response = await api.get('/telemetry', { params });
    return response.data;
  },

  async getByDevice(deviceId, params = {}) {
    const response = await api.get(`/telemetry/${deviceId}`, { params });
    return response.data;
  },

  async getLatest(deviceId) {
    const response = await api.get(`/telemetry/latest/${deviceId}`);
    return response.data;
  },

  async getHistory(deviceId, params = {}) {
    const response = await api.get(`/telemetry/history/${deviceId}`, { params });
    return response.data;
  },
};

export default telemetryService;

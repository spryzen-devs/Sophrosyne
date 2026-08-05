import api from './api';

const alertService = {
  async getAll(params = {}) {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  async getActive(params = {}) {
    const response = await api.get('/alerts/active', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  async getByPatient(patientId, params = {}) {
    const response = await api.get(`/alerts/patient/${patientId}`, { params });
    return response.data;
  },

  async resolve(id) {
    const response = await api.patch(`/alerts/${id}/resolve`);
    return response.data;
  },
};

export default alertService;

import api from './api';

const deviceService = {
  async getAll(params = {}) {
    const response = await api.get('/devices', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  async register(data) {
    const response = await api.post('/devices', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/devices/${id}`, data);
    return response.data;
  },

  async remove(id) {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },

  async assign(id, patientId) {
    const response = await api.patch(`/devices/${id}/assign`, { patientId });
    return response.data;
  },

  async unassign(id) {
    const response = await api.patch(`/devices/${id}/unassign`);
    return response.data;
  },
};

export default deviceService;

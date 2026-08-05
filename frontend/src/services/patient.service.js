import api from './api';

const patientService = {
  async getAll(params = {}) {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/patients', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  async remove(id) {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

export default patientService;

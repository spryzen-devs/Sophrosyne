import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async registerDoctor(data) {
    const response = await api.post('/auth/doctors', data);
    return response.data;
  },

  async getDoctors() {
    const response = await api.get('/auth/doctors');
    return response.data;
  },

  async deleteDoctor(id) {
    const response = await api.delete(`/auth/doctors/${id}`);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;

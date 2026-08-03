import axios from 'axios';
import { mockUser, mockPatients, mockDevices, mockAlerts, mockTelemetryHistory } from './mockData';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// For UI testing without a database, we use a custom adapter that returns mock data.
const mockAdapter = async (config) => {
  const { url, method, data } = config;
  const path = url.replace(API_BASE_URL, '');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let responseData = null;
  let status = 200;

  // --- Auth ---
  if (path === '/auth/login' && method === 'post') {
    const body = JSON.parse(data);
    if (body.email && body.password) {
      responseData = { token: 'mock-jwt-token', user: mockUser };
    } else {
      status = 400;
      responseData = { message: 'Invalid credentials' };
    }
  }
  else if (path === '/auth/me' && method === 'get') {
    responseData = { user: mockUser };
  }
  
  // --- Dashboard ---
  else if (path === '/dashboard/overview' && method === 'get') {
    responseData = {
      totalPatients: mockPatients.length,
      activeDevices: mockDevices.filter(d => d.status === 'ONLINE').length,
      activeAlerts: mockAlerts.filter(a => !a.resolved).length,
      criticalAlerts: mockAlerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length
    };
  }
  else if (path === '/dashboard/recent-alerts' && method === 'get') {
    responseData = { alerts: mockAlerts };
  }
  else if (path === '/dashboard/device-status' && method === 'get') {
    responseData = {
      online: mockDevices.filter(d => d.status === 'ONLINE').length,
      offline: mockDevices.filter(d => d.status === 'OFFLINE').length
    };
  }
  else if (path === '/dashboard/live-patients' && method === 'get') {
    responseData = { patients: mockPatients.filter(p => p.status === 'ACTIVE') };
  }

  // --- Patients ---
  else if (path.startsWith('/patients')) {
    if (method === 'get') {
      const idMatch = path.match(/\/patients\/([^\/]+)$/);
      if (idMatch) {
        const patient = mockPatients.find(p => p.id === idMatch[1]);
        if (patient) responseData = { patient };
        else { status = 404; responseData = { message: 'Patient not found' }; }
      } else {
        responseData = { patients: mockPatients, pagination: { total: mockPatients.length, totalPages: 1 } };
      }
    } else if (method === 'post' || method === 'put' || method === 'delete') {
      responseData = { message: 'Success (Mock)' };
    }
  }
  
  // --- Devices ---
  else if (path.startsWith('/devices')) {
    if (method === 'get') {
      const idMatch = path.match(/\/devices\/([^\/]+)$/);
      if (idMatch) {
        const device = mockDevices.find(d => d.id === idMatch[1]);
        if (device) responseData = { device };
        else { status = 404; responseData = { message: 'Device not found' }; }
      } else {
        responseData = { devices: mockDevices, pagination: { total: mockDevices.length, totalPages: 1 } };
      }
    } else if (method === 'post' || method === 'put' || method === 'delete' || method === 'patch') {
      responseData = { message: 'Success (Mock)' };
    }
  }

  // --- Alerts ---
  else if (path.startsWith('/alerts') && method === 'get') {
    if (path.includes('/patient/')) {
      const idMatch = path.match(/\/alerts\/patient\/([^\/]+)/);
      responseData = { alerts: mockAlerts.filter(a => a.patientId === idMatch[1]) };
    } else if (path === '/alerts/active') {
      responseData = { alerts: mockAlerts.filter(a => !a.resolved) };
    } else {
      // For general /alerts, handle the 'resolved' param if we were parsing it, but for now return all
      responseData = { alerts: mockAlerts, pagination: { total: mockAlerts.length, totalPages: 1 } };
    }
  }
  else if (path.match(/\/alerts\/[^\/]+\/resolve/) && method === 'patch') {
    responseData = { message: 'Alert resolved successfully' };
  }

  // --- Telemetry ---
  else if (path.match(/\/telemetry\/latest\/[^\/]+/) && method === 'get') {
    responseData = { telemetry: mockTelemetryHistory[mockTelemetryHistory.length - 1] };
  }
  else if (path.match(/\/telemetry\/history\/[^\/]+/) && method === 'get') {
    responseData = { telemetry: mockTelemetryHistory };
  }

  // Default / Fallback
  if (!responseData && status === 200) {
    status = 404;
    responseData = { message: 'Mock endpoint not implemented' };
  }

  // Return standard Axios response object
  if (status >= 200 && status < 300) {
    return { data: responseData, status, statusText: 'OK', headers: {}, config, request: {} };
  } else {
    const error = new Error('Request failed');
    error.response = { data: responseData, status, statusText: 'Error', headers: {}, config };
    throw error;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: mockAdapter // Inject the mock adapter to intercept all requests
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sentinel_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import Alerts from './pages/Alerts';
import LiveMonitor from './pages/LiveMonitor';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected (DashboardLayout handles auth guard) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:id" element={<DeviceDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/live-monitor" element={<LiveMonitor />} />
          </Route>

          {/* Redirects & catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 16px',
          },
          success: {
            style: {
              background: 'var(--white)',
              color: 'var(--text-primary)',
              border: '1px solid var(--green-light)',
            },
          },
          error: {
            style: {
              background: 'var(--white)',
              color: 'var(--text-primary)',
              border: '1px solid var(--red-light)',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

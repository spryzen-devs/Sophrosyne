import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import alertService from '../services/alert.service';
import './DashboardLayout.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/devices': 'Devices',
  '/alerts': 'Alerts',
  '/live-monitor': 'Live Monitor',
};

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  // Get page title from route
  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const title = pageTitles[basePath] || 'Sentinel';

  const handleAlertSocket = useCallback((alert) => {
    if (alert && (alert.severity === 'CRITICAL' || alert.severity === 'HIGH')) {
      setHasAlerts(true);
    }
  }, []);

  useSocket({
    onAlert: handleAlertSocket,
  });

  // Check for active critical alerts
  useEffect(() => {
    async function checkAlerts() {
      try {
        const result = await alertService.getActive({ limit: 10 });
        const alerts = result.data || result;
        const activeList = Array.isArray(alerts) ? alerts : [];
        setHasAlerts(activeList.some((a) => !a.resolved));
      } catch {
        // Silently fail
      }
    }
    if (isAuthenticated) {
      checkAlerts();
      const interval = setInterval(checkAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loader__spinner" style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'loader-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar
        title={title}
        hasAlerts={hasAlerts}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="dashboard-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

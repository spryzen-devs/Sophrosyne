import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import dashboardService from '../services/dashboard.service';

export function useDashboardOverview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'overview', user?.id, user?.role],
    queryFn: dashboardService.getOverview,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDashboardRecentAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'recent-alerts', user?.id, user?.role],
    queryFn: dashboardService.getRecentAlerts,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDashboardDeviceStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'device-status', user?.id, user?.role],
    queryFn: dashboardService.getDeviceStatus,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDashboardLivePatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'live-patients', user?.id, user?.role],
    queryFn: dashboardService.getLivePatients,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

import { useQuery } from '@tanstack/react-query';
import alertService from '../services/alert.service';

export function useAlerts(params = {}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertService.getAll(params),
  });
}

export function useActiveAlerts(params = {}) {
  return useQuery({
    queryKey: ['alerts', 'active', params],
    queryFn: () => alertService.getActive(params),
  });
}

export function useAlertsByPatient(patientId, params = {}) {
  return useQuery({
    queryKey: ['alerts', 'patient', patientId, params],
    queryFn: () => alertService.getByPatient(patientId, params),
    enabled: !!patientId,
  });
}

import { useQuery } from '@tanstack/react-query';
import patientService from '../services/patient.service';

export function usePatients(params = {}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientService.getAll(params),
  });
}

export function usePatient(id) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id),
    enabled: !!id,
  });
}

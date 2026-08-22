import { useQuery } from '@tanstack/react-query';
import deviceService from '../services/device.service';

export function useDevices(params = {}) {
  return useQuery({
    queryKey: ['devices', params],
    queryFn: () => deviceService.getAll(params),
  });
}

export function useDevice(id) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => deviceService.getById(id),
    enabled: !!id,
  });
}

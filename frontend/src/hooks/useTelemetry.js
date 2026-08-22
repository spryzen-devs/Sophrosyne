import { useQuery } from '@tanstack/react-query';
import telemetryService from '../services/telemetry.service';

export function useTelemetryLatest(deviceId) {
  return useQuery({
    queryKey: ['telemetry', 'latest', deviceId],
    queryFn: () => telemetryService.getLatest(deviceId),
    enabled: !!deviceId,
  });
}

export function useTelemetryHistory(deviceId, params = {}) {
  return useQuery({
    queryKey: ['telemetry', 'history', deviceId, params],
    queryFn: () => telemetryService.getHistory(deviceId, params),
    enabled: !!deviceId,
  });
}

export function useTelemetryByDevice(deviceId, params = {}) {
  return useQuery({
    queryKey: ['telemetry', deviceId, params],
    queryFn: () => telemetryService.getByDevice(deviceId, params),
    enabled: !!deviceId,
  });
}

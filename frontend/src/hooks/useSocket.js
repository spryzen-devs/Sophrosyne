import { useEffect, useRef } from 'react';
import socketService from '../services/socket.service';

/**
 * Real Socket.IO connection hook for live telemetry and alerts
 */
export function useSocket({ onTelemetry, onAlert, onAlertResolved, patientIds = [] } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect socket using JWT auth from localStorage
    const socket = socketService.connect();
    socketRef.current = socket;

    // Join rooms for all assigned/active patient IDs
    patientIds.forEach((patientId) => {
      if (patientId) {
        socketService.joinPatient(patientId);
      }
    });

    // Telemetry handler wrapper
    const handleTelemetry = (data) => {
      if (onTelemetry && data) {
        onTelemetry(data);
      }
    };

    // Alert handler wrapper
    const handleAlert = (data) => {
      if (onAlert && data) {
        onAlert(data);
      }
    };

    // Alert resolved handler wrapper
    const handleResolved = (data) => {
      if (onAlertResolved && data) {
        onAlertResolved(data);
      }
    };

    // Subscribe to events
    socketService.subscribe('telemetry:new', handleTelemetry);
    socketService.subscribe('telemetry:update', handleTelemetry);
    socketService.subscribe('alert:new', handleAlert);
    socketService.subscribe('alert:resolved', handleResolved);

    // Clean up event listeners & leave rooms on unmount
    return () => {
      patientIds.forEach((patientId) => {
        if (patientId) {
          socketService.leavePatient(patientId);
        }
      });
      socketService.unsubscribe('telemetry:new', handleTelemetry);
      socketService.unsubscribe('telemetry:update', handleTelemetry);
      socketService.unsubscribe('alert:new', handleAlert);
      socketService.unsubscribe('alert:resolved', handleResolved);
    };
  }, [JSON.stringify(patientIds), onTelemetry, onAlert, onAlertResolved]);

  return socketRef;
}

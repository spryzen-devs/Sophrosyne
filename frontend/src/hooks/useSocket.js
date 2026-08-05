import { useEffect, useRef } from 'react';

/**
 * Mock Socket.IO connection hook for UI testing
 */
export function useSocket({ onTelemetry, onAlert, patientIds = [] } = {}) {
  const socketRef = useRef({ emit: () => {}, disconnect: () => {} });

  useEffect(() => {
    if (!onTelemetry || patientIds.length === 0) return;

    // Simulate incoming telemetry every 2 seconds for subscribed patients
    const interval = setInterval(() => {
      patientIds.forEach(patientId => {
        // Find device for this patient in our mock data logic (simplified here)
        // We'll just emit some random fluctuating vitals
        onTelemetry({
          deviceId: `mock-device-${patientId}`,
          patientId: patientId,
          heartRate: 65 + Math.floor(Math.random() * 30),
          spo2: 94 + Math.floor(Math.random() * 6),
          motionState: Math.random() > 0.9 ? 'WALKING' : 'RESTING',
          fallDetected: Math.random() > 0.95,
          battery: 80 + Math.floor(Math.random() * 20),
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [JSON.stringify(patientIds), onTelemetry]);

  return socketRef;
}

/**
 * Simulator Configuration
 */
export const config = {
  // Backend Telemetry API URL
  BACKEND_URL: 'http://localhost:5000/api/v1/telemetry',
  
  // Interval between telemetry updates (ms)
  INTERVAL: 3000,
  
  // Number of devices to simulate
  DEVICE_COUNT: 3,
  
  // Probabilities (0 to 1)
  EMERGENCY_PROBABILITY: 0.05, // 5% chance of an anomaly per update
  FALL_PROBABILITY: 0.01,      // 1% chance of a fall
  
  // Device Codes Prefix
  DEVICE_PREFIX: 'DEV-',
};

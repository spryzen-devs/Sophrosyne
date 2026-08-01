import axios from 'axios';
import { config } from './config.js';
import { getProfile } from './patientProfiles.js';

/**
 * Sentinel Telemetry Simulator
 */
class TelemetrySimulator {
  constructor() {
    this.devices = [];
    this.initDevices();
  }

  /**
   * Initialize simulated devices
   */
  initDevices() {
    for (let i = 1; i <= config.DEVICE_COUNT; i++) {
      const deviceCode = `${config.DEVICE_PREFIX}${i.toString().padStart(4, '0')}`;
      const profile = getProfile(i - 1);
      
      this.devices.push({
        deviceCode,
        profile,
        currentHeartRate: profile.baseHeartRate,
        currentSpo2: profile.baseSpo2,
        currentBattery: profile.baseBattery,
        accel: { x: 0, y: 0, z: 9.8 } // Start at rest
      });
    }
    console.log(`✅ Initialized ${this.devices.length} devices for simulation.`);
  }

  /**
   * Generate realistic telemetry for a device
   * @param {Object} device 
   */
  generateTelemetry(device) {
    const isEmergency = Math.random() < config.EMERGENCY_PROBABILITY;
    const isFall = Math.random() < config.FALL_PROBABILITY;
    
    // Normal fluctuations
    let heartRate = device.currentHeartRate + (Math.random() * 4 - 2);
    let spo2 = device.currentSpo2 + (Math.random() * 0.4 - 0.2);
    
    // Clamp values
    heartRate = Math.max(60, Math.min(100, heartRate));
    spo2 = Math.max(95, Math.min(100, spo2));

    // Override for emergencies
    if (isEmergency) {
      const type = Math.random();
      if (type < 0.4) {
        heartRate = 130 + Math.random() * 20; // High HR
      } else if (type < 0.7) {
        heartRate = 35 - Math.random() * 5;   // Low HR
      } else {
        spo2 = 85 - Math.random() * 5;        // Low SpO2
      }
    }

    // Battery decreases slowly
    device.currentBattery -= 0.01;
    if (device.currentBattery < 0) device.currentBattery = 100;

    // Acceleration changes
    const accelX = Math.random() * 0.5 - 0.25;
    const accelY = Math.random() * 0.5 - 0.25;
    const accelZ = 9.8 + (Math.random() * 0.5 - 0.25);

    // Update current values for next iteration
    device.currentHeartRate = heartRate;
    device.currentSpo2 = spo2;

    const payload = {
      deviceCode: device.deviceCode,
      heartRate: Math.round(heartRate),
      spo2: Math.round(spo2),
      accelX: parseFloat(accelX.toFixed(2)),
      accelY: parseFloat(accelY.toFixed(2)),
      accelZ: parseFloat(accelZ.toFixed(2)),
      motionState: isFall ? 'FALL' : device.profile.motionPreference,
      fallDetected: isFall,
      battery: Math.round(device.currentBattery)
    };

    return payload;
  }

  /**
   * Send telemetry to backend
   * @param {Object} payload 
   */
  async sendTelemetry(payload) {
    try {
      const response = await axios.post(config.BACKEND_URL, payload);
      
      console.log(`[${payload.deviceCode}]`);
      console.log(`  HR: ${payload.heartRate} BPM`);
      console.log(`  SpO2: ${payload.spo2}%`);
      console.log(`  Battery: ${payload.battery}%`);
      console.log(`  Status: SENT (${response.status})`);
      
      if (payload.fallDetected) console.log('  ⚠️ ALERT: FALL DETECTED!');
      if (payload.heartRate > 120 || payload.heartRate < 40) console.log(`  ⚠️ ALERT: HEART RATE (${payload.heartRate})`);
      if (payload.spo2 < 90) console.log(`  ⚠️ ALERT: LOW SPO2 (${payload.spo2})`);
      
    } catch (error) {
      console.error(`[${payload.deviceCode}] Error:`, error.response?.data?.message || error.message);
    }
  }

  /**
   * Start the simulation loop
   */
  start() {
    console.log(`🚀 Starting simulation. Sending data every ${config.INTERVAL / 1000} seconds...`);
    
    setInterval(() => {
      this.devices.forEach(async (device) => {
        const payload = this.generateTelemetry(device);
        await this.sendTelemetry(payload);
      });
    }, config.INTERVAL);
  }
}

// Run Simulator
const simulator = new TelemetrySimulator();
simulator.start();

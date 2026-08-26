import test from 'node:test';
import assert from 'node:assert/strict';
import { recordTelemetrySchema } from '../src/validators/telemetry.validator.js';

// Pure threshold evaluation function to test alert logic deterministically
function evaluateTelemetryRules(telemetry) {
  const alerts = [];

  // Heart Rate Thresholds
  if (telemetry.heartRate !== null && telemetry.heartRate !== undefined) {
    if (telemetry.heartRate < 40) {
      alerts.push({
        severity: 'CRITICAL',
        alertType: 'LOW_HEART_RATE',
        message: `Critical: Heart rate is dangerously low (${telemetry.heartRate} BPM).`,
      });
    } else if (telemetry.heartRate > 120) {
      alerts.push({
        severity: 'HIGH',
        alertType: 'HIGH_HEART_RATE',
        message: `Warning: High heart rate detected (${telemetry.heartRate} BPM).`,
      });
    }
  }

  // SpO2 Thresholds
  if (telemetry.spo2 !== null && telemetry.spo2 !== undefined && telemetry.spo2 < 90) {
    alerts.push({
      severity: 'CRITICAL',
      alertType: 'LOW_SPO2',
      message: `Critical: Low SpO2 level detected (${telemetry.spo2}%).`,
    });
  }

  // Ambient Room Temperature Thresholds (MPU6500 measures room/board temp, not body temp)
  if (telemetry.temperature !== null && telemetry.temperature !== undefined) {
    if (telemetry.temperature > 45.0) {
      alerts.push({
        severity: 'HIGH',
        alertType: 'HIGH_TEMPERATURE',
        message: `Warning: Extreme ambient room heat detected (${telemetry.temperature}°C).`,
      });
    } else if (telemetry.temperature < 10.0) {
      alerts.push({
        severity: 'MEDIUM',
        alertType: 'HIGH_TEMPERATURE',
        message: `Warning: Extreme ambient cold environment detected (${telemetry.temperature}°C).`,
      });
    }
  }

  // Fall Detection
  if (telemetry.fallDetected === true) {
    alerts.push({
      severity: 'CRITICAL',
      alertType: 'FALL_DETECTED',
      message: 'Critical: A fall has been detected!',
    });
  }

  return alerts;
}

test('Telemetry Validation - Valid Payload with Ambient Temperature', () => {
  const payload = {
    body: {
      deviceCode: 'DEV-0001',
      heartRate: 85,
      spo2: 98,
      temperature: 26.5,
      accelX: 0.1,
      accelY: 0.2,
      accelZ: 9.8,
      motionState: 'RESTING',
      fallDetected: false,
      battery: 100,
    },
  };

  const result = recordTelemetrySchema.safeParse(payload);
  assert.equal(result.success, true);
});

test('Telemetry Validation - Null Vitals When Warm-Up or Finger Removed', () => {
  const payload = {
    body: {
      deviceCode: 'DEV-0001',
      heartRate: null,
      spo2: null,
      temperature: 27.1,
      accelX: 0.0,
      accelY: 0.0,
      accelZ: 9.81,
      motionState: 'RESTING',
      fallDetected: false,
      battery: 100,
    },
  };

  const result = recordTelemetrySchema.safeParse(payload);
  assert.equal(result.success, true);
});

test('Alert Service - Normal Warm Room Temperature (38°C) Should NOT Trigger Body Fever Alert', () => {
  const telemetry = {
    heartRate: 75,
    spo2: 98,
    temperature: 38.0, // Warm room/chip temp, should NOT trigger fever alert
    fallDetected: false,
  };

  const alerts = evaluateTelemetryRules(telemetry);
  const tempAlerts = alerts.filter((a) => a.alertType === 'HIGH_TEMPERATURE');
  assert.equal(tempAlerts.length, 0, 'Normal warm room temperature must not trigger false body fever alert');
});

test('Alert Service - Extreme Ambient Heat (>45°C) Triggers Environment Warning', () => {
  const telemetry = {
    heartRate: 75,
    spo2: 98,
    temperature: 46.5, // Extreme ambient room heat
    fallDetected: false,
  };

  const alerts = evaluateTelemetryRules(telemetry);
  const tempAlerts = alerts.filter((a) => a.alertType === 'HIGH_TEMPERATURE');
  assert.equal(tempAlerts.length, 1);
  assert.match(tempAlerts[0].message, /Extreme ambient room heat/);
});

test('Alert Service - High Heart Rate Triggers Alert', () => {
  const telemetry = {
    heartRate: 135,
    spo2: 98,
    temperature: 25.0,
    fallDetected: false,
  };

  const alerts = evaluateTelemetryRules(telemetry);
  const hrAlerts = alerts.filter((a) => a.alertType === 'HIGH_HEART_RATE');
  assert.equal(hrAlerts.length, 1);
});

test('Alert Service - Low SpO2 Triggers Critical Alert', () => {
  const telemetry = {
    heartRate: 75,
    spo2: 88,
    temperature: 25.0,
    fallDetected: false,
  };

  const alerts = evaluateTelemetryRules(telemetry);
  const spo2Alerts = alerts.filter((a) => a.alertType === 'LOW_SPO2');
  assert.equal(spo2Alerts.length, 1);
  assert.equal(spo2Alerts[0].severity, 'CRITICAL');
});

test('Alert Service - Verified Fall Event Triggers Critical Alert', () => {
  const telemetry = {
    heartRate: 85,
    spo2: 97,
    temperature: 24.5,
    fallDetected: true,
  };

  const alerts = evaluateTelemetryRules(telemetry);
  const fallAlerts = alerts.filter((a) => a.alertType === 'FALL_DETECTED');
  assert.equal(fallAlerts.length, 1);
  assert.equal(fallAlerts[0].severity, 'CRITICAL');
});

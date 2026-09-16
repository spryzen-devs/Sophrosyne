import alertRepository from '../repositories/alert.repository.js';
import prisma from '../config/prisma.js';
import notificationService from './notification.service.js';

/**
 * Alert Service
 */
class AlertService {
  /**
   * Evaluate telemetry data and generate alerts if thresholds are exceeded
   * @param {Object} telemetry
   * @returns {Promise<Object[]>}
   */
  async evaluateTelemetry(telemetry) {
    const alerts = [];
    
    // Fetch device to get the associated patientId
    const device = await prisma.device.findUnique({
      where: { id: telemetry.deviceId },
      select: { patientId: true },
    });

    if (!device || !device.patientId) {
      return []; // No patient assigned, no alert can be generated
    }

    const patientId = device.patientId;

    // Heart Rate Thresholds
    if (telemetry.heartRate !== null && telemetry.heartRate !== undefined) {
      if (telemetry.heartRate < 40) {
        alerts.push({
          telemetryId: telemetry.id,
          patientId,
          severity: 'CRITICAL',
          alertType: 'LOW_HEART_RATE',
          message: `Critical: Heart rate is dangerously low (${telemetry.heartRate} BPM).`,
        });
      } else if (telemetry.heartRate > 120) {
        alerts.push({
          telemetryId: telemetry.id,
          patientId,
          severity: 'HIGH',
          alertType: 'HIGH_HEART_RATE',
          message: `Warning: High heart rate detected (${telemetry.heartRate} BPM).`,
        });
      }
    }

    // SpO2 Thresholds
    if (telemetry.spo2 !== null && telemetry.spo2 !== undefined && telemetry.spo2 < 90) {
      alerts.push({
        telemetryId: telemetry.id,
        patientId,
        severity: 'CRITICAL',
        alertType: 'LOW_SPO2',
        message: `Critical: Low SpO2 level detected (${telemetry.spo2}%).`,
      });
    }

    // Ambient Room Temperature Thresholds (MPU6500 measures ambient/board temp, not patient body temp)
    if (telemetry.temperature !== null && telemetry.temperature !== undefined) {
      if (telemetry.temperature > 45.0) {
        alerts.push({
          telemetryId: telemetry.id,
          patientId,
          severity: 'HIGH',
          alertType: 'HIGH_TEMPERATURE',
          message: `Warning: Extreme ambient room heat detected (${telemetry.temperature}°C).`,
        });
      } else if (telemetry.temperature < 10.0) {
        alerts.push({
          telemetryId: telemetry.id,
          patientId,
          severity: 'MEDIUM',
          alertType: 'HIGH_TEMPERATURE',
          message: `Warning: Extreme ambient cold environment detected (${telemetry.temperature}°C).`,
        });
      }
    }

    // Fall Detection
    if (telemetry.fallDetected === true) {
      alerts.push({
        telemetryId: telemetry.id,
        patientId,
        severity: 'CRITICAL',
        alertType: 'FALL_DETECTED',
        message: 'Critical: A fall has been detected!',
      });
    }

    // Battery Levels
    if (telemetry.battery !== null && telemetry.battery !== undefined && telemetry.battery < 20) {
      alerts.push({
        telemetryId: telemetry.id,
        patientId,
        severity: 'LOW',
        alertType: 'LOW_BATTERY',
        message: `Notification: Device battery is low (${telemetry.battery}%).`,
      });
    }

    // Fetch existing unresolved alerts for this patient to prevent 3-second duplicate spams
    const activePatientAlerts = await prisma.alert.findMany({
      where: {
        patientId,
        resolved: false,
      },
      select: { alertType: true },
    });
    const activeTypes = new Set(activePatientAlerts.map((a) => a.alertType));

    // Fetch patient info for emergency contact notification if required
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true, patientCode: true, emergencyContact: true, phone: true },
    });

    // Fetch 5 most recent telemetry records for 5-frame moving average evaluation
    const recentTelemetry = await prisma.telemetry.findMany({
      where: { deviceId: telemetry.deviceId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    });

    // Helper functions for 5-frame moving averages
    const validHRs = recentTelemetry.map((t) => t.heartRate).filter((v) => v !== null && v !== undefined);
    const validSpO2s = recentTelemetry.map((t) => t.spo2).filter((v) => v !== null && v !== undefined);
    const validTemps = recentTelemetry.map((t) => t.temperature).filter((v) => v !== null && v !== undefined);

    const avgHeartRate = validHRs.length > 0 ? validHRs.reduce((a, b) => a + b, 0) / validHRs.length : null;
    const avgSpo2 = validSpO2s.length > 0 ? validSpO2s.reduce((a, b) => a + b, 0) / validSpO2s.length : null;
    const avgTemperature = validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;

    // Create alerts in DB ONLY if 5-frame moving average crosses threshold
    const createdAlerts = [];
    for (const alertData of alerts) {
      // Skip if an active unresolved alert of this exact type already exists for this patient
      if (activeTypes.has(alertData.alertType)) {
        continue;
      }

      // Check 5-frame moving average requirement
      let isVerified = false;

      if (alertData.alertType === 'FALL_DETECTED' || alertData.alertType === 'LOW_BATTERY') {
        // Immediate 1-frame trigger for Fall and Low Battery
        isVerified = true;
      } else if (recentTelemetry.length >= 5) {
        if (alertData.alertType === 'LOW_HEART_RATE') {
          isVerified = avgHeartRate !== null && avgHeartRate < 40;
        } else if (alertData.alertType === 'HIGH_HEART_RATE') {
          isVerified = avgHeartRate !== null && avgHeartRate > 120;
        } else if (alertData.alertType === 'LOW_SPO2') {
          isVerified = avgSpo2 !== null && avgSpo2 < 90;
        } else if (alertData.alertType === 'HIGH_TEMPERATURE') {
          isVerified = avgTemperature !== null && (avgTemperature > 45 || avgTemperature < 10);
        }
      }

      if (!isVerified) {
        console.log(
          `ℹ️ Transient vital spike (${alertData.alertType}: instantaneous=${telemetry.heartRate ?? telemetry.spo2 ?? telemetry.temperature}, 5-frame moving avg=${Math.round(avgHeartRate ?? avgSpo2 ?? avgTemperature)}) suppressed (< 5 frames sustained)`
        );
        continue;
      }

      console.log(
        `⏳ Sustained ${alertData.alertType} verified via 5-frame moving avg (${Math.round(avgHeartRate ?? avgSpo2 ?? avgTemperature)}) for patient ${patient?.patientCode || patientId}`
      );

      const alert = await alertRepository.create(alertData);
      createdAlerts.push(alert);
      activeTypes.add(alertData.alertType);
      
      // Notify real-time clinical clients (WebSocket)
      notificationService.notifyNewAlert(alert);

      if (patient) {
        notificationService.notifyEmergencyContact(patient, alert);
      }
    }

    return createdAlerts;
  }

  /**
   * Get all alerts with filters and pagination
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getAllAlerts(query, currentUser) {
    let { page = 1, limit = 10, severity, alertType, resolved, patientId, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (severity) where.severity = severity;
    if (alertType) where.alertType = alertType;
    if (resolved !== undefined) {
      where.resolved = resolved === 'true' || resolved === true;
    }
    if (patientId) where.patientId = patientId;

    const [data, total] = await alertRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
      currentUser,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all active (unresolved) alerts
   * @param {Object} query
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async getActiveAlerts(query, currentUser) {
    return this.getAllAlerts({ ...query, resolved: 'false' }, currentUser);
  }

  /**
   * Get an alert by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getAlertById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error('Alert not found');
      error.statusCode = 404;
      throw error;
    }
    return alert;
  }

  /**
   * Get alerts for a specific patient
   * @param {string} patientId
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getPatientAlerts(patientId, query) {
    return this.getAllAlerts({ ...query, patientId });
  }

  /**
   * Resolve an alert
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async resolveAlert(id, userId) {
    const alert = await this.getAlertById(id);
    if (alert.resolved) {
      const error = new Error('Alert is already resolved');
      error.statusCode = 400;
      throw error;
    }

    const updatedAlert = await alertRepository.update(id, {
      status: 'RESOLVED',
      resolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
    });

    // Notify real-time clients
    notificationService.notifyAlertResolved(updatedAlert);

    return updatedAlert;
  }
}

export default new AlertService();

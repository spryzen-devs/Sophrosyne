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

    // Create alerts in DB and handle emergency escalation to closed ones
    const createdAlerts = [];
    for (const alertData of alerts) {
      // Skip if an active unresolved alert of this exact type already exists for this patient
      if (activeTypes.has(alertData.alertType)) {
        continue;
      }

      const alert = await alertRepository.create(alertData);
      createdAlerts.push(alert);
      activeTypes.add(alertData.alertType);
      
      // Notify real-time clinical clients
      notificationService.notifyNewAlert(alert);

      if (patient) {
        // 1. Fall Detection: Immediate Emergency Dispatch to closed ones
        if (alert.alertType === 'FALL_DETECTED') {
          notificationService.notifyEmergencyContact(patient, alert);
        }

        // 2. Critical Heart Rate: Dispatch to closed ones ONLY if sustained across 5 consecutive telemetry frames (15s)
        else if (alert.alertType === 'LOW_HEART_RATE' || alert.alertType === 'HIGH_HEART_RATE') {
          const recentTelemetry = await prisma.telemetry.findMany({
            where: { deviceId: telemetry.deviceId },
            orderBy: { recordedAt: 'desc' },
            take: 5,
          });

          if (recentTelemetry.length >= 5) {
            const isSustainedLow = alert.alertType === 'LOW_HEART_RATE' &&
              recentTelemetry.every((t) => t.heartRate !== null && t.heartRate !== undefined && t.heartRate < 40);

            const isSustainedHigh = alert.alertType === 'HIGH_HEART_RATE' &&
              recentTelemetry.every((t) => t.heartRate !== null && t.heartRate !== undefined && t.heartRate > 120);

            if (isSustainedLow || isSustainedHigh) {
              console.log(`⏳ Sustained BPM Alert verified across 5 consecutive frames (15s) for patient ${patient.patientCode}`);
              notificationService.notifyEmergencyContact(patient, alert);
            } else {
              console.log(`ℹ️ Transient BPM Alert logged to DB, emergency dispatch to closed ones suppressed (< 5 frames sustained)`);
            }
          }
        }
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

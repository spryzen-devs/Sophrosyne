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

    // Temperature Thresholds
    if (telemetry.temperature !== null && telemetry.temperature !== undefined && telemetry.temperature > 38.0) {
      alerts.push({
        telemetryId: telemetry.id,
        patientId,
        severity: 'HIGH',
        alertType: 'HIGH_TEMPERATURE',
        message: `Warning: High temperature detected (${telemetry.temperature}°C).`,
      });
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

    // Create alerts in DB
    const createdAlerts = [];
    for (const alertData of alerts) {
      const alert = await alertRepository.create(alertData);
      createdAlerts.push(alert);
      
      // Notify real-time clients
      notificationService.notifyNewAlert(alert);
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

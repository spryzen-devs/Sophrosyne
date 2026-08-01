import { getIO } from '../websocket/socket.js';

/**
 * Notification Service
 * Handles broadcasting real-time updates via Socket.IO
 */
class NotificationService {
  /**
   * Broadcast new telemetry to patient-specific room and globally
   * @param {string} patientId
   * @param {string} deviceCode
   * @param {Object} telemetry
   */
  notifyNewTelemetry(patientId, deviceCode, telemetry) {
    const io = getIO();
    const payload = this._serializeData({
      patientId,
      deviceCode,
      telemetry,
    });

    // Emit to specific patient room
    console.log(`🔥 Emitting telemetry:new for patient:${patientId}`);
    io.to(`patient:${patientId}`).emit('telemetry:new', payload);
    // Also emit globally for monitoring dashboard (optional but often useful)
    io.emit('telemetry:new', payload);
  }

  /**
   * Broadcast new alert to patient-specific room and globally
   * @param {Object} alert
   */
  notifyNewAlert(alert) {
    const io = getIO();
    const payload = this._serializeData({
      alertId: alert.id,
      severity: alert.severity,
      patientId: alert.patientId,
      alertType: alert.alertType,
      message: alert.message,
    });

    // Emit to specific patient room
    console.log(`🔥 Emitting alert:new for patient:${alert.patientId}`);
    io.to(`patient:${alert.patientId}`).emit('alert:new', payload);
    // Emit globally for clinical staff
    io.emit('alert:new', payload);
  }

  /**
   * Broadcast alert resolution
   * @param {Object} alert
   */
  notifyAlertResolved(alert) {
    const io = getIO();
    const payload = this._serializeData({
      alertId: alert.id,
      patientId: alert.patientId,
      resolvedAt: alert.resolvedAt,
      resolvedBy: alert.resolvedBy,
    });

    // Emit to specific patient room
    console.log(`🔥 Emitting alert:resolved for patient:${alert.patientId}`);
    io.to(`patient:${alert.patientId}`).emit('alert:resolved', payload);
    // Emit globally
    io.emit('alert:resolved', payload);
  }

  /**
   * Helper to handle BigInt serialization for JSON
   * @param {Object} data
   * @returns {Object}
   * @private
   */
  _serializeData(data) {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  }
}

export default new NotificationService();

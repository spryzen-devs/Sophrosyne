import axios from 'axios';
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
    if (!io) return;

    const payload = this._serializeData({
      patientId,
      deviceCode,
      deviceId: telemetry.deviceId,
      telemetry,
      heartRate: telemetry.heartRate,
      spo2: telemetry.spo2,
      temperature: telemetry.temperature,
      motionState: telemetry.motionState,
      fallDetected: telemetry.fallDetected,
      battery: telemetry.battery,
      recordedAt: telemetry.recordedAt,
    });

    // Emit to specific patient room & globally
    console.log(`🔥 Emitting telemetry:update for patient:${patientId} (${deviceCode})`);
    io.to(`patient:${patientId}`).emit('telemetry:new', payload);
    io.to(`patient:${patientId}`).emit('telemetry:update', payload);
    io.emit('telemetry:new', payload);
    io.emit('telemetry:update', payload);
  }

  /**
   * Broadcast new alert to patient-specific room and globally
   * @param {Object} alert
   */
  notifyNewAlert(alert) {
    const io = getIO();
    if (!io) return;

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
    if (!io) return;

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
   * Dispatch emergency notification & SMS to emergency contact / closed ones
   * @param {Object} patient
   * @param {Object} alert
   */
  async notifyEmergencyContact(patient, alert) {
    let rawContact = patient.emergencyContact || patient.phone || '6369942568';
    let formattedPhone = rawContact.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const smsMessage = `🚨 SENTINEL EMERGENCY ALERT: ${alert.severity} alert for ${patientName} (${patient.patientCode}). ${alert.message}`;

    console.log(`\n==================================================`);
    console.log(`📲 DISPATCHING EMERGENCY SMS TO PHONE`);
    console.log(`👤 Patient: ${patientName} (${patient.patientCode})`);
    console.log(`📞 Target Phone: +${formattedPhone}`);
    console.log(`💬 SMS Content: ${smsMessage}`);
    console.log(`==================================================\n`);

    // 1. Try Callmebot Free WhatsApp API if API key is set
    if (process.env.CALLMEBOT_API_KEY) {
      try {
        const response = await axios.get('https://api.callmebot.com/whatsapp.php', {
          params: {
            phone: `+${formattedPhone}`,
            text: smsMessage,
            apikey: process.env.CALLMEBOT_API_KEY,
          },
        });
        console.log('✅ Callmebot WhatsApp Dispatch Successful:', response.data);
      } catch (err) {
        console.error('❌ Callmebot WhatsApp Error:', err.response?.data || err.message);
      }
    }

    // 2. Try Fast2SMS if API key is set
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            route: 'q',
            message: smsMessage,
            language: 'english',
            flash: 0,
            numbers: formattedPhone.replace(/^91/, ''), // 10-digit number for Fast2SMS
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
            },
          }
        );
        console.log('✅ Fast2SMS SMS Dispatch Successful:', response.data);
      } catch (err) {
        console.error('❌ Fast2SMS Dispatch Failed:', err.response?.data || err.message);
      }
    }
    // 2. Try Twilio SMS & Twilio WhatsApp if credentials are set
    else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      
      // Send Twilio WhatsApp Alert
      try {
        const waParams = new URLSearchParams();
        waParams.append('To', `whatsapp:+${formattedPhone}`);
        waParams.append('From', 'whatsapp:+14155238886'); // Twilio WhatsApp Sandbox Number
        waParams.append('Body', smsMessage);

        const waRes = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          waParams.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${auth}`,
            },
          }
        );
        console.log('✅ Twilio WhatsApp Dispatch Successful SID:', waRes.data.sid);
      } catch (waErr) {
        console.error('❌ Twilio WhatsApp Info:', waErr.response?.data?.message || waErr.message);
      }

      // Send Twilio SMS Alert
      try {
        const smsParams = new URLSearchParams();
        smsParams.append('To', `+${formattedPhone}`);
        smsParams.append('From', process.env.TWILIO_PHONE_NUMBER || '+17372212163');
        smsParams.append('Body', smsMessage);

        const smsRes = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          smsParams.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${auth}`,
            },
          }
        );
        console.log('✅ Twilio SMS Dispatch Successful SID:', smsRes.data.sid);
      } catch (err) {
        console.error('❌ Twilio SMS Dispatch Info:', err.response?.data?.message || err.message);
      }
    } else {
      console.log('ℹ️ SMS Gateway API Key (FAST2SMS_API_KEY or TWILIO) not set in .env. Console dispatch payload logged above.');
    }

    // Emit real-time WebSocket emergency event for live UI display
    const io = getIO();
    if (io) {
      const payload = this._serializeData({
        patientId: patient.id,
        patientName,
        contact: `+${formattedPhone}`,
        alertType: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        dispatchedAt: new Date().toISOString(),
      });
      io.to(`patient:${patient.id}`).emit('emergency:notification', payload);
      io.emit('emergency:notification', payload);
    }
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

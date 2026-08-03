import prisma from '../config/prisma.js';

/**
 * Dashboard Repository
 */
class DashboardRepository {
  /**
   * Get basic counts and averages for dashboard overview
   * @returns {Promise<Object>}
   */
  async getOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      activePatients,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeAlerts,
      criticalAlerts,
      todayTelemetry,
      telemetryAggregates,
      lastTelemetry
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { status: 'ACTIVE' } }),
      prisma.device.count(),
      prisma.device.count({ where: { status: 'ONLINE' } }),
      prisma.device.count({ where: { status: 'OFFLINE' } }),
      prisma.alert.count({ where: { resolved: false } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', resolved: false } }),
      prisma.telemetry.count({ where: { recordedAt: { gte: today } } }),
      prisma.telemetry.aggregate({
        _avg: {
          heartRate: true,
          spo2: true,
          battery: true,
        },
      }),
      prisma.telemetry.findFirst({
        orderBy: { recordedAt: 'desc' },
        select: { recordedAt: true },
      }),
    ]);

    return {
      totalPatients,
      activePatients,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeAlerts,
      criticalAlerts,
      todayTelemetry,
      averageHeartRate: telemetryAggregates._avg.heartRate || 0,
      averageSpo2: telemetryAggregates._avg.spo2 || 0,
      averageBattery: telemetryAggregates._avg.battery || 0,
      lastTelemetryReceived: lastTelemetry?.recordedAt || null,
      systemStatus: 'HEALTHY', // Logic can be more complex based on alerts/offline devices
    };
  }

  /**
   * Get recent alerts
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecentAlerts(limit = 10) {
    return prisma.alert.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        telemetry: {
          select: {
            device: {
              select: {
                deviceCode: true,
              },
            },
          },
        },
        severity: true,
        alertType: true,
        message: true,
        createdAt: true,
        resolved: true,
      },
    });
  }

  /**
   * Get live patients data
   * @returns {Promise<Array>}
   */
  async getLivePatients() {
    // Get online devices that have an assigned patient
    const devices = await prisma.device.findMany({
      where: {
        status: 'ONLINE',
        patientId: { not: null },
      },
      select: {
        deviceCode: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        telemetry: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: {
            heartRate: true,
            spo2: true,
            battery: true,
            motionState: true,
            fallDetected: true,
            recordedAt: true,
          },
        },
      },
    });

    return devices.map((d) => ({
      patientId: d.patient.id,
      patientName: `${d.patient.firstName} ${d.patient.lastName}`,
      deviceCode: d.deviceCode,
      latestHeartRate: d.telemetry[0]?.heartRate || null,
      latestSpo2: d.telemetry[0]?.spo2 || null,
      battery: d.telemetry[0]?.battery || null,
      motionState: d.telemetry[0]?.motionState || null,
      fallDetected: d.telemetry[0]?.fallDetected || false,
      lastUpdated: d.telemetry[0]?.recordedAt || null,
      patientStatus: d.patient.status,
    }));
  }

  /**
   * Get all devices status
   * @returns {Promise<Array>}
   */
  async getDeviceStatus() {
    const devices = await prisma.device.findMany({
      select: {
        deviceCode: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        firmwareVersion: true,
        hardwareVersion: true,
        batteryLevel: true,
        status: true,
        lastSeen: true,
        registeredAt: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    return devices.map((d) => ({
      deviceCode: d.deviceCode,
      patientName: d.patient ? `${d.patient.firstName} ${d.patient.lastName}` : 'N/A',
      firmwareVersion: d.firmwareVersion,
      hardwareVersion: d.hardwareVersion,
      battery: d.batteryLevel,
      status: d.status,
      lastSeen: d.lastSeen,
      registeredAt: d.registeredAt,
    }));
  }
}

export default new DashboardRepository();

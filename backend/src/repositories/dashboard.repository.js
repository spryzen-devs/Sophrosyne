import prisma from '../config/prisma.js';

/**
 * Dashboard Repository
 */
class DashboardRepository {
  /**
   * Get basic counts and averages for dashboard overview
   * @returns {Promise<Object>}
   */
  async getOverviewStats(currentUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDoctor = currentUser?.role === 'DOCTOR';
    const doctorFilter = isDoctor ? { assignedDoctorId: currentUser.userId } : {};
    const patientDeviceFilter = isDoctor ? { patient: { assignedDoctorId: currentUser.userId } } : {};

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
      prisma.patient.count({ where: doctorFilter }),
      prisma.patient.count({ where: { status: 'ACTIVE', ...doctorFilter } }),
      prisma.device.count({ where: patientDeviceFilter }),
      prisma.device.count({ where: { status: 'ONLINE', ...patientDeviceFilter } }),
      prisma.device.count({ where: { status: 'OFFLINE', ...patientDeviceFilter } }),
      prisma.alert.count({ where: { resolved: false, ...patientDeviceFilter } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', resolved: false, ...patientDeviceFilter } }),
      prisma.telemetry.count({ where: { recordedAt: { gte: today }, device: patientDeviceFilter } }),
      prisma.telemetry.aggregate({
        where: { device: patientDeviceFilter },
        _avg: {
          heartRate: true,
          spo2: true,
          battery: true,
        },
      }),
      prisma.telemetry.findFirst({
        where: { device: patientDeviceFilter },
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
      systemStatus: 'HEALTHY',
    };
  }

  /**
   * Get recent alerts
   * @param {number} limit
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getRecentAlerts(limit = 10, currentUser) {
    const where = {};
    if (currentUser?.role === 'DOCTOR') {
      where.patient = {
        assignedDoctorId: currentUser.userId,
      };
    }

    return prisma.alert.findMany({
      where,
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
  async getLivePatients(currentUser) {
    const where = {
      patientId: { not: null },
    };

    if (currentUser?.role === 'DOCTOR') {
      where.patient = {
        assignedDoctorId: currentUser.userId,
      };
    }

    const devices = await prisma.device.findMany({
      where,
      select: {
        id: true,
        deviceCode: true,
        status: true,
        batteryLevel: true,
        lastSeen: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
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
            temperature: true,
            battery: true,
            motionState: true,
            fallDetected: true,
            recordedAt: true,
          },
        },
      },
    });

    return devices.map((d) => {
      const latest = d.telemetry[0] || null;
      return {
        id: d.patient.id,
        patientId: d.patient.id,
        patientCode: d.patient.patientCode,
        firstName: d.patient.firstName,
        lastName: d.patient.lastName,
        patientName: `${d.patient.firstName} ${d.patient.lastName}`,
        patientStatus: d.patient.status,
        devices: [
          {
            id: d.id,
            deviceCode: d.deviceCode,
            status: d.status,
            batteryLevel: d.batteryLevel,
            lastSeen: d.lastSeen,
          },
        ],
        device: {
          id: d.id,
          deviceCode: d.deviceCode,
          status: d.status,
          batteryLevel: d.batteryLevel,
          lastSeen: d.lastSeen,
        },
        latestTelemetry: latest
          ? {
              heartRate: latest.heartRate,
              spo2: latest.spo2,
              temperature: latest.temperature,
              battery: latest.battery,
              motionState: latest.motionState,
              fallDetected: latest.fallDetected,
              recordedAt: latest.recordedAt,
            }
          : null,
      };
    });
  }

  /**
   * Get all devices status
   * @returns {Promise<Array>}
   */
  async getDeviceStatus(currentUser) {
    const where = {};
    if (currentUser?.role === 'DOCTOR') {
      where.patient = {
        assignedDoctorId: currentUser.userId,
      };
    }

    const devices = await prisma.device.findMany({
      where,
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

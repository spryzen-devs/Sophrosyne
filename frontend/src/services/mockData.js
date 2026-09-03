export const mockUser = {
  id: 'u1',
  fullName: 'Dr. Gregory House',
  email: 'admin@gmail.com',
  role: 'ADMIN',
  phone: '555-0199',
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
};

export const mockPatients = [
  { id: 'p1', patientCode: 'PAT-001', firstName: 'John', lastName: 'Doe', gender: 'MALE', dateOfBirth: '1980-05-15', bloodGroup: 'O+', phone: '555-0101', address: '123 Main St', status: 'ACTIVE', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'p2', patientCode: 'PAT-002', firstName: 'Jane', lastName: 'Smith', gender: 'FEMALE', dateOfBirth: '1992-10-20', bloodGroup: 'A-', phone: '555-0102', address: '456 Oak Ave', status: 'ACTIVE', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'p3', patientCode: 'PAT-003', firstName: 'Robert', lastName: 'Johnson', gender: 'MALE', dateOfBirth: '1965-03-10', bloodGroup: 'B+', phone: '555-0103', address: '789 Pine Rd', status: 'INACTIVE', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
];

export const mockDevices = [
  { id: 'd1', deviceCode: 'SEN-0001', status: 'ONLINE', batteryLevel: 85, firmwareVersion: '1.2.0', hardwareVersion: '1.0', ipAddress: '192.168.1.101', lastSeen: new Date().toISOString(), registeredAt: new Date(Date.now() - 10 * 86400000).toISOString(), patientId: 'p1' },
  { id: 'd2', deviceCode: 'SEN-0002', status: 'OFFLINE', batteryLevel: 10, firmwareVersion: '1.1.0', hardwareVersion: '1.0', ipAddress: '192.168.1.102', lastSeen: new Date(Date.now() - 86400000).toISOString(), registeredAt: new Date(Date.now() - 5 * 86400000).toISOString(), patientId: 'p2' },
  { id: 'd3', deviceCode: 'SEN-0003', status: 'ONLINE', batteryLevel: 98, firmwareVersion: '1.2.0', hardwareVersion: '1.1', ipAddress: '192.168.1.103', lastSeen: new Date().toISOString(), registeredAt: new Date(Date.now() - 1 * 86400000).toISOString(), patientId: null }
];

// Map devices to patients for easier access
mockDevices.forEach(d => {
  if (d.patientId) d.patient = mockPatients.find(p => p.id === d.patientId);
});
mockPatients.forEach(p => {
  p.devices = mockDevices.filter(d => d.patientId === p.id);
  p.latestTelemetry = {
    heartRate: 72 + Math.floor(Math.random() * 10),
    spo2: 96 + Math.floor(Math.random() * 4),
    motionState: 'RESTING',
    battery: p.devices[0]?.batteryLevel || 100,
    recordedAt: new Date().toISOString()
  };
});

export const mockAlerts = [
  { id: 'a1', severity: 'CRITICAL', alertType: 'HIGH_HEART_RATE', patientId: 'p1', message: 'Heart rate exceeded 120 BPM', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), resolved: false },
  { id: 'a2', severity: 'HIGH', alertType: 'LOW_SPO2', patientId: 'p2', message: 'SpO2 dropped below 90%', createdAt: new Date(Date.now() - 3600000).toISOString(), resolved: true, resolvedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a3', severity: 'MEDIUM', alertType: 'LOW_BATTERY', patientId: 'p2', message: 'Device battery below 15%', createdAt: new Date(Date.now() - 7200000).toISOString(), resolved: false },
];
// Map patients to alerts
mockAlerts.forEach(a => {
  a.patient = mockPatients.find(p => p.id === a.patientId);
});

export const mockTelemetryHistory = Array.from({ length: 24 }).map((_, i) => ({
  recordedAt: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  heartRate: 70 + Math.floor(Math.random() * 20),
  spo2: 95 + Math.floor(Math.random() * 5),
  motionState: 'RESTING',
  battery: 100 - i
}));

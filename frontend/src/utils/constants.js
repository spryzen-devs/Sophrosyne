export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  TECHNICIAN: 'TECHNICIAN',
};

export const PATIENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const DEVICE_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

export const MOTION_STATES = {
  RESTING: 'RESTING',
  WALKING: 'WALKING',
  RUNNING: 'RUNNING',
  FALL: 'FALL',
};

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const ALERT_TYPES = {
  HIGH_HEART_RATE: 'HIGH_HEART_RATE',
  LOW_HEART_RATE: 'LOW_HEART_RATE',
  LOW_SPO2: 'LOW_SPO2',
  HIGH_TEMPERATURE: 'HIGH_TEMPERATURE',
  FALL_DETECTED: 'FALL_DETECTED',
  LOW_BATTERY: 'LOW_BATTERY',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_TAMPERED: 'DEVICE_TAMPERED',
};

export const GENDERS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/devices', label: 'Devices', icon: 'Cpu' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/live-monitor', label: 'Live Monitor', icon: 'Activity' },
];

/**
 * Patient Profiles for Simulator
 * Defines baseline values for different patients
 */
export const patientProfiles = [
  {
    name: "John Doe",
    baseHeartRate: 72,
    baseSpo2: 98,
    baseTemperature: 36.6,
    baseBattery: 95,
    motionPreference: "RESTING"
  },
  {
    name: "Jane Smith",
    baseHeartRate: 68,
    baseSpo2: 99,
    baseTemperature: 36.8,
    baseBattery: 88,
    motionPreference: "WALKING"
  },
  {
    name: "Robert Brown",
    baseHeartRate: 75,
    baseSpo2: 97,
    baseTemperature: 37.0,
    baseBattery: 92,
    motionPreference: "RESTING"
  }
];

/**
 * Get a profile for a specific device index
 * @param {number} index 
 */
export const getProfile = (index) => {
  return patientProfiles[index % patientProfiles.length];
};

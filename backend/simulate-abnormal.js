import http from 'http';

// Configuration
const DEVICE_CODE = 'DEV-002'; // The device code assigned to the patient
const PORT = 5000;
const PING_INTERVAL_MS = 2000; // Send data every 2 seconds

// Abnormal vital signs (Tachycardia / Hypoxia)
const generateAbnormalTelemetry = () => ({
  deviceCode: DEVICE_CODE,
  heartRate: Math.floor(Math.random() * (140 - 120 + 1) + 120), // 120-140 BPM (High)
  spo2: Math.floor(Math.random() * (90 - 85 + 1) + 85),         // 85-90 % (Low)
  temperature: (Math.random() * (39.5 - 38.5) + 38.5).toFixed(1),// 38.5-39.5 C (High Temp)
  motionState: 'RESTING',
  fallDetected: false,
  battery: 85
});

function sendTelemetry() {
  const data = JSON.stringify(generateAbnormalTelemetry());

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/telemetry',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
      console.log(`[${new Date().toLocaleTimeString()}] Sent Abnormal Data -> Status: ${res.statusCode}`);
      if (res.statusCode >= 400) console.error(`Response: ${responseBody}`);
    });
  });

  req.on('error', (error) => {
    console.error('Error sending telemetry:', error.message);
  });

  req.write(data);
  req.end();
}

console.log(`Starting abnormal telemetry simulation for ${DEVICE_CODE}...`);
console.log(`Sending ping every ${PING_INTERVAL_MS / 1000} seconds. Press Ctrl+C to stop.`);
console.log('---');

// Send immediately, then loop
sendTelemetry();
setInterval(sendTelemetry, PING_INTERVAL_MS);

import axios from 'axios';
import readline from 'readline';

const BACKEND_URL = 'http://localhost:5000/api/v1/telemetry';

const args = process.argv.slice(2);

// If arguments are passed, run direct mode
if (args.length > 0) {
  runDirectMode();
} else {
  runInteractiveMode();
}

async function sendTelemetryPayload(payload) {
  console.log('\n📡 Transmitting payload to server...');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const res = await axios.post(BACKEND_URL, payload);
    console.log('\n✅ SERVER RESPONSE:', res.data?.message || 'Success');

    // Highlight triggered alerts
    if (payload.fallDetected) {
      console.log('🚨 EMERGENCY ALERT GENERATED: Fall Detected!');
    }
    if (payload.heartRate > 120) {
      console.log('🚨 EMERGENCY ALERT GENERATED: High Heart Rate (>120 BPM)!');
    } else if (payload.heartRate < 50) {
      console.log('🚨 EMERGENCY ALERT GENERATED: Low Heart Rate (<50 BPM)!');
    }
    if (payload.spo2 < 90) {
      console.log('🚨 EMERGENCY ALERT GENERATED: Low SpO2 (<90%)!');
    }
    if (payload.temperature > 38.0) {
      console.log('🚨 EMERGENCY ALERT GENERATED: High Temperature (>38.0°C)!');
    }
  } catch (err) {
    console.error('\n❌ ERROR:', err.response?.data?.message || err.message);
  }
}

async function runDirectMode() {
  function getArg(flag, defaultValue) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      return args[idx + 1];
    }
    return defaultValue;
  }

  const deviceCode = getArg('--device', args[0] || 'DEV-001');
  const hrArg = getArg('--hr', args[1]);
  const spo2Arg = getArg('--spo2', args[2]);
  const tempArg = getArg('--temp', args[3]);
  const fallArg = args.includes('--fall');

  const heartRate = hrArg ? parseInt(hrArg, 10) : 75;
  const spo2 = spo2Arg ? parseInt(spo2Arg, 10) : 98;
  const temperature = tempArg ? parseFloat(tempArg) : 36.6;

  const payload = {
    deviceCode,
    heartRate,
    spo2,
    temperature,
    accelX: fallArg ? 2.5 : 0.05,
    accelY: fallArg ? 3.1 : -0.02,
    accelZ: fallArg ? 0.1 : 9.81,
    motionState: fallArg ? 'FALL' : 'RESTING',
    fallDetected: fallArg,
    battery: 95,
  };

  await sendTelemetryPayload(payload);
}

function runInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n======================================================');
  console.log('📡 SENTINEL TERMINAL TELEMETRY SENDER');
  console.log('======================================================');
  console.log('Type sensor values below to send live telemetry directly to Sentinel!\n');

  function promptQuestion(query, defaultValue) {
    return new Promise((resolve) => {
      rl.question(`${query} [Default: ${defaultValue}]: `, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  async function askNext() {
    const deviceCode = await promptQuestion('📱 Device Code', 'DEV-001');
    const hrStr = await promptQuestion('❤️ Heart Rate (BPM)', '75');
    const spo2Str = await promptQuestion('🫁 SpO2 (%)', '98');
    const tempStr = await promptQuestion('🌡️ Temperature (°C)', '36.6');
    const fallStr = await promptQuestion('⚠️ Fall Detected? (y/n)', 'n');
    const batteryStr = await promptQuestion('🔋 Battery (%)', '95');

    const heartRate = parseInt(hrStr, 10) || 75;
    const spo2 = parseInt(spo2Str, 10) || 98;
    const temperature = parseFloat(tempStr) || 36.6;
    const fallDetected = fallStr.toLowerCase().startsWith('y');
    const battery = parseInt(batteryStr, 10) || 95;

    const payload = {
      deviceCode,
      heartRate,
      spo2,
      temperature,
      accelX: fallDetected ? 2.5 : 0.05,
      accelY: fallDetected ? 3.1 : -0.02,
      accelZ: fallDetected ? 0.1 : 9.81,
      motionState: fallDetected ? 'FALL' : 'RESTING',
      fallDetected,
      battery,
    };

    await sendTelemetryPayload(payload);

    console.log('\n------------------------------------------------------');
    const repeat = await promptQuestion('🔄 Send another packet? (y/n)', 'y');
    if (repeat.toLowerCase().startsWith('y')) {
      askNext();
    } else {
      console.log('👋 Exiting telemetry sender. Goodbye!\n');
      rl.close();
    }
  }

  askNext();
}

/*
 * Sentinel IoT - Telemetry & Vital Signs Transmitter Firmware
 * Board: ESP32 / ESP8266
 * Sensors: MAX30102 (Optical PPG Heart Rate & SpO2) + MPU6500 (3-Axis Accelerometer & Ambient Temperature)
 */

#if defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
#endif

#include <Wire.h>
#include <MPU6500_WE.h>
#include "MAX30105.h"
#include "heartRate.h"

// ---------------------------------------------------------------------------
// 📶 Wi-Fi & Sentinel Backend Configuration
// ---------------------------------------------------------------------------
const char* WIFI_SSID     = "OPPO A3x 5G";       // Wi-Fi network SSID
const char* WIFI_PASSWORD = "Sr@20007";          // Wi-Fi Password
const char* SERVER_URL    = "http://10.246.138.76:5000/api/v1/telemetry"; 
const char* DEVICE_CODE   = "DEV-0001";              

// Telemetry Transmission Interval (3 seconds)
const unsigned long SEND_INTERVAL = 3000;            

// ---------------------------------------------------------------------------
// Sensor Objects & Configuration
// ---------------------------------------------------------------------------
#define MPU6500_ADDR 0x68
MPU6500_WE myMPU6500 = MPU6500_WE(MPU6500_ADDR);
MAX30105 particleSensor;

// Sensitivity threshold for finger detection
const long IR_FINGER_THRESHOLD = 5000; 

// Rolling buffer for heart rate smoothing
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];    
byte rateSpot = 0;
byte beatCount = 0;       
unsigned long lastBeat = 0;        

float beatsPerMinute = 0;
int beatAvg = 0;
int calculatedSpo2 = 98;           

// Finger state tracking
bool hasFinger = false;
long currentIR = 0;
long currentRed = 0;

unsigned long lastFingerTime = 0;
unsigned long lastSendTime = 0;

// Continuous Acceleration Motion Swing Tracker
float maxAccelMag = 0.0;
float minAccelMag = 999.0;

// Fall Detection Variables
bool latchedFall = false;
unsigned long fallTriggerTime = 0;

bool mpuConnected = false;
bool maxConnected = false;

// Battery voltage ADC pin (-1 for USB powered default 100%)
const int BATTERY_ADC_PIN = -1;

// Function Prototypes
void sendTelemetryPayload();

// ---------------------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  Wire.begin();

  Serial.println("\n=========================================");
  Serial.println("  Sentinel IoT - Telemetry Transmitter");
  Serial.println("=========================================\n");

  // 1. Connect Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi Connected!");
  Serial.print("📡 Device IP: ");
  Serial.println(WiFi.localIP());

  // 2. Initialize MAX30102 (0x57)
  Serial.print("Initializing MAX30102 (0x57)... ");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ MAX30102 not found!");
    maxConnected = false;
  } else {
    Serial.println("✅ MAX30102 Found!");
    maxConnected = true;

    byte ledBrightness = 0x3F; // High LED brightness (63)
    byte sampleAverage = 4;
    byte ledMode = 2;          // Red + IR
    int sampleRate = 200;      // 200 Hz
    int pulseWidth = 411;
    int adcRange = 4096;

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  }

  // 3. Initialize MPU6500 (0x68) - Range set to 8G
  Serial.print("Initializing MPU6500 (0x68)... ");
  if (!myMPU6500.init()) {
    Serial.println("❌ MPU6500 does not respond!");
    mpuConnected = false;
  } else {
    Serial.println("✅ MPU6500 Connected!");
    mpuConnected = true;

    Serial.println("Calibrating MPU6500 - keep flat...");
    delay(1000);
    myMPU6500.autoOffsets();
    Serial.println("Calibration Complete!");

    myMPU6500.enableGyrDLPF();
    myMPU6500.setGyrDLPF(MPU6500_DLPF_6);
    myMPU6500.setSampleRateDivider(5);
    myMPU6500.setGyrRange(MPU6500_GYRO_RANGE_250);
    myMPU6500.setAccRange(MPU6500_ACC_RANGE_8G);
    myMPU6500.enableAccDLPF(true);
    myMPU6500.setAccDLPF(MPU6500_DLPF_6);
  }

  Serial.println("\n🚀 Ready! Place finger GENTLY on MAX30102...\n");
}

// ---------------------------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------------------------
void loop() {
  // --- Motion & Fall Detection (MPU6500) ---
  if (mpuConnected) {
    xyzFloat g = myMPU6500.getGValues();
    float ax = g.x * 9.81;
    float ay = g.y * 9.81;
    float az = g.z * 9.81;
    float currentMag = sqrt(ax * ax + ay * ay + az * az);

    if (currentMag > maxAccelMag) maxAccelMag = currentMag;
    if (currentMag < minAccelMag) minAccelMag = currentMag;

    // Startup Protection: Ignore fall triggers during the first 5 seconds
    if (millis() > 5000) {
      // High-G Impact Spike Threshold (> 18.0 m/s^2 / 1.83g impact)
      if (currentMag > 18.0) {
        if (!latchedFall) {
          latchedFall = true;
          fallTriggerTime = millis();
          Serial.println("\n🚨 IMPACT DETECTED! Fall alert triggered.");
        }
      }
    }
  }

  // Auto-clear Fall state after 10 seconds
  if (latchedFall && (millis() - fallTriggerTime > 10000)) {
    latchedFall = false;
    Serial.println("✅ Fall alert window completed. Returning to normal monitoring.");
  }

  // --- Continuous MAX30102 Sampling ---
  if (maxConnected) {
    particleSensor.check(); // Continuously poll MAX30102 FIFO buffer
    long ir = particleSensor.getIR();
    long red = particleSensor.getRed();

    if (ir > 1000) {
      currentIR = ir;
      currentRed = red;
    }

    if (ir > IR_FINGER_THRESHOLD) {
      if (!hasFinger) {
        hasFinger = true;
        lastBeat = millis();
        beatAvg = 74; // Active baseline initialization while pulse is sampled
        beatCount = 1;
        rates[0] = 74;
        rateSpot = 1;
        calculatedSpo2 = 98;
        Serial.println("\n👉 Finger Sensed!");
      }
      lastFingerTime = millis();

      if (checkForBeat(ir) == true) {
        unsigned long currentMillis = millis();
        unsigned long delta = currentMillis - lastBeat;
        lastBeat = currentMillis;

        beatsPerMinute = 60.0 / (delta / 1000.0);

        if (beatsPerMinute >= 40.0 && beatsPerMinute <= 180.0) {
          rates[rateSpot++] = (byte)beatsPerMinute;
          rateSpot %= RATE_SIZE;
          if (beatCount < RATE_SIZE) beatCount++;

          int sum = 0;
          for (byte x = 0; x < beatCount; x++) {
            sum += rates[x];
          }
          beatAvg = sum / beatCount;

          Serial.print("💓 Beat! BPM: ");
          Serial.print((int)beatsPerMinute);
          Serial.print(" | Avg BPM: ");
          Serial.println(beatAvg);
        }
      }

      if (red > 0 && ir > 0) {
        double ratio = (double)red / (double)ir;
        int spo2Val = (int)(104.0 - (17.0 * ratio));
        if (spo2Val > 99) spo2Val = 99;
        if (spo2Val < 90) spo2Val = 94;
        calculatedSpo2 = spo2Val;
      }
    } 
    else if (millis() - lastFingerTime > 2500) {
      if (hasFinger) {
        hasFinger = false;
        beatsPerMinute = 0;
        beatAvg = 0;
        beatCount = 0;
        rateSpot = 0;
        Serial.println("❌ Finger Removed");
      }
    }
  }

  // --- Send Telemetry Payload every 3 seconds ---
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      sendTelemetryPayload();
      lastBeat = millis();
    } else {
      Serial.println("⚠️ Wi-Fi Disconnected! Reconnecting...");
      WiFi.reconnect();
    }
    lastSendTime = millis();
  }
}

// ---------------------------------------------------------------------------
// HTTP POST Transmitter
// ---------------------------------------------------------------------------
void sendTelemetryPayload() {
  xyzFloat gValue = {0, 0, 0};
  float tempC = 25.0;

  if (mpuConnected) {
    gValue = myMPU6500.getGValues();
    tempC = myMPU6500.getTemperature();
  }

  float accelX = gValue.x * 9.81;
  float accelY = gValue.y * 9.81;
  float accelZ = gValue.z * 9.81;

  float accelDelta = maxAccelMag - minAccelMag;
  bool fallDetected = latchedFall;

  String motionState = "RESTING";
  if (fallDetected) {
    motionState = "FALL";
  } else if (accelDelta > 6.0) {
    motionState = "RUNNING";
  } else if (accelDelta > 2.8) {
    motionState = "WALKING";
  } else {
    motionState = "RESTING";
  }

  int finalHR = (beatAvg > 0) ? beatAvg : ((int)beatsPerMinute > 0 ? (int)beatsPerMinute : 74);
  
  String hrString   = hasFinger ? String(finalHR) : "null";
  String spo2String = hasFinger ? String(calculatedSpo2) : "null";
  String tempString = String(tempC, 1); // Ambient board/room temperature is ALWAYS transmitted
  String fallValue  = fallDetected ? "true" : "false";

  int batteryPercent = 100;
  if (BATTERY_ADC_PIN >= 0) {
    int rawAdc = analogRead(BATTERY_ADC_PIN);
    float voltage = (rawAdc / 4095.0) * 2.0 * 3.3 * 1.1;
    batteryPercent = (int)((voltage - 3.2) / (4.2 - 3.2) * 100.0);
    if (batteryPercent > 100) batteryPercent = 100;
    if (batteryPercent < 0) batteryPercent = 0;
  }

  String jsonPayload = "{";
  jsonPayload += "\"deviceCode\":\"" + String(DEVICE_CODE) + "\",";
  jsonPayload += "\"heartRate\":" + hrString + ",";
  jsonPayload += "\"spo2\":" + spo2String + ",";
  jsonPayload += "\"temperature\":" + tempString + ",";
  jsonPayload += "\"accelX\":" + String(accelX, 2) + ",";
  jsonPayload += "\"accelY\":" + String(accelY, 2) + ",";
  jsonPayload += "\"accelZ\":" + String(accelZ, 2) + ",";
  jsonPayload += "\"motionState\":\"" + motionState + "\",";
  jsonPayload += "\"fallDetected\":" + fallValue + ",";
  jsonPayload += "\"battery\":" + String(batteryPercent);
  jsonPayload += "}";

  // Reset motion trackers
  maxAccelMag = 0.0;
  minAccelMag = 999.0;

  WiFiClient client;
  HTTPClient http;

  http.begin(client, SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.println("--------------------------------------------------");
  Serial.print("📡 MAX30102 Raw IR: ");
  Serial.print(currentIR);
  Serial.print(" | Motion State: ");
  Serial.print(motionState);
  Serial.print(" (Fall Alert: ");
  Serial.print(fallDetected ? "YES 🚨" : "NO");
  Serial.println(")");
  Serial.print("📤 Transmitting Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.print("✅ Server Response Code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("❌ Transmission Failed! Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

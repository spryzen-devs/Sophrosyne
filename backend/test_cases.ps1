# ============================================================================
# SENTINEL TELEMETRY TEST CASES (PowerShell Invoke-RestMethod)
# ============================================================================
# Run this script or copy-paste any command below to test Sentinel!

$baseUrl = "http://localhost:5000/api/v1/telemetry"
$device = "DEV-002"

Write-Host "🚀 Running Sentinel Telemetry Test Suite..." -ForegroundColor Cyan

# ----------------------------------------------------------------------------
# TC-12: Normal Vitals Baseline (No Alert)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-12] Testing Normal Vitals..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":72,`"spo2`":98,`"temperature`":36.6,`"motionState`":`"RESTING`",`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-11: Critical Low Heart Rate (< 40 BPM)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-11] Testing Critical Low Heart Rate (35 BPM)..." -ForegroundColor Red
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":35,`"spo2`":98,`"temperature`":36.6,`"motionState`":`"RESTING`",`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-13: High Heart Rate Alert (> 120 BPM)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-13] Testing High Heart Rate (135 BPM)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":135,`"spo2`":98,`"temperature`":36.6,`"motionState`":`"RESTING`",`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-14: Critical Low SpO2 Alert (< 90%)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-14] Testing Critical Low SpO2 (87%)..." -ForegroundColor Red
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":72,`"spo2`":87,`"temperature`":36.6,`"motionState`":`"RESTING`",`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-15: High Temperature Ambient Heat Alert (> 45.0°C)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-15] Testing High Ambient Temperature (48.5°C)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":72,`"spo2`":98,`"temperature`":48.5,`"motionState`":`"RESTING`",`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-06: Emergency Fall Detection Alert
# ----------------------------------------------------------------------------
Write-Host "`n[TC-06] Testing Emergency Fall Detection..." -ForegroundColor Red
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":75,`"spo2`":98,`"temperature`":36.6,`"motionState`":`"FALL`",`"fallDetected`":true,`"accelX`":2.5,`"accelY`":3.1,`"accelZ`":0.1,`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-09: Motion Classifier - Walking
# ----------------------------------------------------------------------------
Write-Host "`n[TC-09] Testing Walking Motion..." -ForegroundColor Green
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":88,`"spo2`":98,`"temperature`":36.6,`"motionState`":`"WALKING`",`"accelX`":0.8,`"accelY`":0.6,`"accelZ`":9.8,`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-10: Motion Classifier - Running
# ----------------------------------------------------------------------------
Write-Host "`n[TC-10] Testing Running Motion..." -ForegroundColor Green
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body "{`"deviceCode`":`"$device`",`"heartRate`":115,`"spo2`":97,`"temperature`":37.1,`"motionState`":`"RUNNING`",`"accelX`":1.5,`"accelY`":1.8,`"accelZ`":10.2,`"battery`":95}"

# ----------------------------------------------------------------------------
# TC-01: Sensor Gating - No Finger / Off-body (Null Vitals)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-01] Testing Sensor Off-body (Null Vitals)..." -ForegroundColor DarkGray
Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body '{"deviceCode":"DEV-002","heartRate":null,"spo2":null,"temperature":null,"motionState":"RESTING","battery":95}'

# ----------------------------------------------------------------------------
# TC-24: Unassigned Device Rejection (DEV-001 is unassigned)
# ----------------------------------------------------------------------------
Write-Host "`n[TC-24] Testing Unassigned Device Rejection (DEV-001)..." -ForegroundColor Red
try {
  Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body '{"deviceCode":"DEV-001","heartRate":72,"spo2":98,"temperature":36.6}'
} catch {
  Write-Host "✅ Correctly rejected unassigned device DEV-001: $_" -ForegroundColor Green
}

Write-Host "`n🎉 All PowerShell Test Cases Executed!" -ForegroundColor Cyan

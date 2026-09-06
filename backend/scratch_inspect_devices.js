import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  const devices = await prisma.device.findMany({
    include: { patient: true },
  });
  console.log('--- DEVICES IN DB ---');
  devices.forEach((d) => {
    console.log(`Code: ${d.deviceCode} | Status: ${d.status} | IP: ${d.ipAddress} | FW: ${d.firmwareVersion} | HW: ${d.hardwareVersion} | Patient: ${d.patient ? `${d.patient.name} (${d.patient.patientCode})` : 'Unassigned'}`);
  });

  const telemetryCount = await prisma.telemetry.count();
  console.log(`\nTOTAL TELEMETRY COUNT IN DB: ${telemetryCount}`);

  const recentTelemetry = await prisma.telemetry.findMany({
    take: 5,
    orderBy: { recordedAt: 'desc' },
    include: { device: true },
  });
  console.log('\n--- RECENT TELEMETRY SAMPLES ---');
  recentTelemetry.forEach((t) => {
    console.log(`[${t.recordedAt.toISOString()}] Device: ${t.device.deviceCode} | HR: ${t.heartRate} | SpO2: ${t.spo2} | Temp: ${t.temperature} | Fall: ${t.fallDetected}`);
  });
}

inspect().finally(() => prisma.$disconnect());

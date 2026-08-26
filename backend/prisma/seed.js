import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing alerts, telemetry, devices, patients, and doctors...');

  // Delete in order of dependencies
  await prisma.alert.deleteMany({});
  await prisma.telemetry.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: 'DOCTOR',
    },
  });

  console.log('🌱 Seeding fresh users (Admin + 3 Doctors), 3 Patients, and 3 Devices...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const watsonPasswordHash = await bcrypt.hash('watson123', 10);
  const cameronPasswordHash = await bcrypt.hash('cameron123', 10);
  const chasePasswordHash = await bcrypt.hash('chase123', 10);

  // 1. Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sentinel.com' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN' },
    create: {
      fullName: 'Dr. Gregory House',
      email: 'admin@sentinel.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '555-0100',
    },
  });

  // 2. Seed 3 Doctors
  const doctor1 = await prisma.user.create({
    data: {
      fullName: 'Dr. John Watson',
      email: 'dr.watson@sentinel.com',
      passwordHash: watsonPasswordHash,
      role: 'DOCTOR',
      phone: '555-0101',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      fullName: 'Dr. Allison Cameron',
      email: 'dr.cameron@sentinel.com',
      passwordHash: cameronPasswordHash,
      role: 'DOCTOR',
      phone: '555-0102',
    },
  });

  const doctor3 = await prisma.user.create({
    data: {
      fullName: 'Dr. Robert Chase',
      email: 'dr.chase@sentinel.com',
      passwordHash: chasePasswordHash,
      role: 'DOCTOR',
      phone: '555-0103',
    },
  });

  // 3. Seed 3 Patients (Matching Simulator Patient Profiles)
  const patient1 = await prisma.patient.create({
    data: {
      patientCode: 'PAT-0001',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      age: 45,
      gender: 'MALE',
      dateOfBirth: new Date('1981-04-12'),
      bloodGroup: 'O+',
      phone: '6369942568',
      emergencyContact: '6369942568',
      address: '123 Health Ave, Cityville',
      status: 'ACTIVE',
      createdBy: admin.id,
      assignedDoctorId: doctor1.id,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      patientCode: 'PAT-0002',
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      age: 38,
      gender: 'FEMALE',
      dateOfBirth: new Date('1988-09-25'),
      bloodGroup: 'A-',
      phone: '555-0202',
      emergencyContact: '555-0902',
      address: '456 Wellness Blvd, Metro',
      status: 'ACTIVE',
      createdBy: admin.id,
      assignedDoctorId: doctor2.id,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      patientCode: 'PAT-0003',
      firstName: 'Robert',
      lastName: 'Brown',
      name: 'Robert Brown',
      age: 52,
      gender: 'MALE',
      dateOfBirth: new Date('1974-01-15'),
      bloodGroup: 'B+',
      phone: '555-0203',
      emergencyContact: '555-0903',
      address: '789 Care Lane, Suburbia',
      status: 'ACTIVE',
      createdBy: admin.id,
      assignedDoctorId: doctor3.id,
    },
  });

  // 4. Seed 3 Devices (Matching Simulator Device Codes DEV-0001, DEV-0002, DEV-0003)
  const device1 = await prisma.device.create({
    data: {
      deviceCode: 'DEV-0001',
      firmwareVersion: '1.4.2',
      hardwareVersion: '2.0',
      status: 'ONLINE',
      batteryLevel: 95,
      patientId: patient1.id,
    },
  });

  const device2 = await prisma.device.create({
    data: {
      deviceCode: 'DEV-0002',
      firmwareVersion: '1.4.2',
      hardwareVersion: '2.0',
      status: 'ONLINE',
      batteryLevel: 88,
      patientId: patient2.id,
    },
  });

  const device3 = await prisma.device.create({
    data: {
      deviceCode: 'DEV-0003',
      firmwareVersion: '1.4.2',
      hardwareVersion: '2.0',
      status: 'ONLINE',
      batteryLevel: 92,
      patientId: patient3.id,
    },
  });

  console.log('\n======================================================');
  console.log('✅ FRESH SEED COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log('🔑 ADMIN CREDENTIALS:');
  console.log(`   Email: ${admin.email} | Password: admin123`);
  console.log('\n👨‍⚕️ DOCTOR CREDENTIALS:');
  console.log(`   1. ${doctor1.fullName} -> Email: ${doctor1.email} | Password: watson123 (Assigned: ${patient1.name} / ${device1.deviceCode})`);
  console.log(`   2. ${doctor2.fullName} -> Email: ${doctor2.email} | Password: cameron123 (Assigned: ${patient2.name} / ${device2.deviceCode})`);
  console.log(`   3. ${doctor3.fullName} -> Email: ${doctor3.email} | Password: chase123 (Assigned: ${patient3.name} / ${device3.deviceCode})`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

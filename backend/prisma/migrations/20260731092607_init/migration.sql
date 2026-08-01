-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "MotionState" AS ENUM ('RESTING', 'WALKING', 'RUNNING', 'FALL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('HEART_RATE', 'SPO2', 'FALL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "patientCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "bloodGroup" TEXT,
    "phone" TEXT,
    "emergencyContact" TEXT,
    "address" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "patientId" UUID,
    "firmwareVersion" TEXT,
    "hardwareVersion" TEXT,
    "batteryLevel" INTEGER,
    "ipAddress" TEXT,
    "lastSeen" TIMESTAMP(3),
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" BIGSERIAL NOT NULL,
    "deviceId" UUID NOT NULL,
    "heartRate" DOUBLE PRECISION,
    "spo2" DOUBLE PRECISION,
    "accelX" DOUBLE PRECISION,
    "accelY" DOUBLE PRECISION,
    "accelZ" DOUBLE PRECISION,
    "motionState" "MotionState" NOT NULL DEFAULT 'RESTING',
    "fallDetected" BOOLEAN NOT NULL DEFAULT false,
    "battery" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" UUID NOT NULL,
    "telemetryId" BIGINT,
    "patientId" UUID NOT NULL,
    "severity" "Severity" NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE INDEX "Patient_patientCode_idx" ON "Patient"("patientCode");

-- CreateIndex
CREATE INDEX "Patient_createdBy_idx" ON "Patient"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceCode_key" ON "Device"("deviceCode");

-- CreateIndex
CREATE INDEX "Device_deviceCode_idx" ON "Device"("deviceCode");

-- CreateIndex
CREATE INDEX "Device_patientId_idx" ON "Device"("patientId");

-- CreateIndex
CREATE INDEX "Telemetry_deviceId_idx" ON "Telemetry"("deviceId");

-- CreateIndex
CREATE INDEX "Telemetry_recordedAt_idx" ON "Telemetry"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_telemetryId_key" ON "Alert"("telemetryId");

-- CreateIndex
CREATE INDEX "Alert_patientId_idx" ON "Alert"("patientId");

-- CreateIndex
CREATE INDEX "Alert_telemetryId_idx" ON "Alert"("telemetryId");

-- CreateIndex
CREATE INDEX "Alert_resolvedBy_idx" ON "Alert"("resolvedBy");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_telemetryId_fkey" FOREIGN KEY ("telemetryId") REFERENCES "Telemetry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

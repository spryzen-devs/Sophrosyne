import { z } from 'zod';

/**
 * Telemetry Zod Validation Schemas
 */

const MotionStateEnum = z.enum(['RESTING', 'WALKING', 'RUNNING', 'FALL']);

export const recordTelemetrySchema = z.object({
  body: z.object({
    deviceCode: z.string().min(1, 'Device code is required'),
    heartRate: z.number().nullable().optional(),
    spo2: z.number().nullable().optional(),
    accelX: z.number().nullable().optional(),
    accelY: z.number().nullable().optional(),
    accelZ: z.number().nullable().optional(),
    motionState: MotionStateEnum.default('RESTING'),
    fallDetected: z.boolean().default(false),
    battery: z.number().int().min(0).max(100).nullable().optional(),
  }),
});

export const getTelemetryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    deviceId: z.string().uuid().optional(),
    motionState: MotionStateEnum.optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    }).optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    }).optional(),
  }),
});

import { z } from 'zod';

/**
 * Alert Zod Validation Schemas
 */

const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const AlertTypeEnum = z.enum(['LOW_HEART_RATE', 'HIGH_HEART_RATE', 'LOW_SPO2', 'FALL_DETECTED', 'LOW_BATTERY']);

export const getAlertsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    severity: SeverityEnum.optional(),
    alertType: AlertTypeEnum.optional(),
    resolved: z.enum(['true', 'false']).optional(),
    patientId: z.string().uuid().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

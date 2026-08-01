import { z } from 'zod';

/**
 * Patient Zod Validation Schemas
 */

const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
const PatientStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: GenderEnum,
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
    bloodGroup: z.string().optional(),
    phone: z.string().optional(),
    emergencyContact: z.string().optional(),
    address: z.string().optional(),
    status: PatientStatusEnum.default('ACTIVE'),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    gender: GenderEnum.optional(),
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }).optional(),
    bloodGroup: z.string().optional(),
    phone: z.string().optional(),
    emergencyContact: z.string().optional(),
    address: z.string().optional(),
    status: PatientStatusEnum.optional(),
  }),
});

export const getPatientsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    patientCode: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

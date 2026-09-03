import { z } from 'zod';

/**
 * Authentication Validators
 */
export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .refine((val) => val.toLowerCase().endsWith('@gmail.com'), {
        message: 'Email must be a valid Gmail address ending with @gmail.com',
      }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'DOCTOR'], {
      errorMap: () => ({ message: 'Role must be ADMIN or DOCTOR' }),
    }),
    phone: z.string().optional(),
  }),
});

export const registerDoctorSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .refine((val) => val.toLowerCase().endsWith('@gmail.com'), {
        message: 'Email must be a valid Gmail address ending with @gmail.com',
      }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'DOCTOR']).optional().default('DOCTOR'),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

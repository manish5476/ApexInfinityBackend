import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z.string().optional(),
    organizationId: z.string().optional(),
    uniqueShopId: z.string().optional(),
    phone: z.string().optional(),
    roles: z.array(z.string()).optional(),
  })
  .refine((data) => !data.passwordConfirm || data.passwordConfirm === data.password, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  uniqueShopId: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z.string().optional(),
  })
  .refine((data) => !data.passwordConfirm || data.passwordConfirm === data.password, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const updateMyPasswordSchema = z
  .object({
    passwordCurrent: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z.string().optional(),
  })
  .refine((data) => !data.passwordConfirm || data.passwordConfirm === data.password, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

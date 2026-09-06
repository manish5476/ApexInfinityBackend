import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(2).max(30),
  userId: z.string().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  joiningDate: z.string().optional(),
  workMode: z.enum(['on_site', 'remote', 'hybrid']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  shiftId: z.string().optional(),
  allowWebPunch: z.boolean().optional(),
  biometricId: z.string().optional(),
  bankDetails: z
    .object({
      panNumber: z.string().optional(),
      uanNumber: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankName: z.string().optional(),
    })
    .optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  workMode: z.enum(['on_site', 'remote', 'hybrid']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  status: z.enum(['active', 'probation', 'notice_period', 'resigned', 'terminated']).optional(),
  exitDate: z.string().optional(),
  shiftId: z.string().optional(),
  allowWebPunch: z.boolean().optional(),
  biometricId: z.string().optional(),
  bankDetails: z
    .object({
      panNumber: z.string().optional(),
      uanNumber: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankName: z.string().optional(),
    })
    .optional(),
});

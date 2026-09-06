import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

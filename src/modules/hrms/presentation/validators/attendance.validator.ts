import { z } from 'zod';

export const recordPunchSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required.'),
  type: z.enum(['in', 'out']),
  timestamp: z.string().optional(),
  deviceId: z.string().optional(),
  source: z.string().optional(),
});

import { z } from 'zod';

export const upsertFeatureFlagSchema = z.object({
  key: z.string().min(1).trim(),
  name: z.string().min(1).trim(),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  rules: z.record(z.unknown()).optional().default({}),
});

export const upsertSettingSchema = z.object({
  namespace: z.string().min(1).trim(),
  key: z.string().min(1).trim(),
  value: z.unknown(),
  encrypted: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export const auditQuerySchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 50)),
  action: z.string().optional(),
  resource: z.string().optional(),
  actorId: z.string().optional(),
});

export const reportGenerateSchema = z.object({
  type: z.string().optional().default('system_summary'),
});

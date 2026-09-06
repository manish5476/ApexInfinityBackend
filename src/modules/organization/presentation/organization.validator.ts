import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters long')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

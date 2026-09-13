import { z } from 'zod';

// Schema for the full organization onboarding/creation
export const createOrganizationSchema = z.object({
  // Organization fields
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100).trim(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
  uniqueShopId: z.string().min(2).max(30).trim().optional(),
  primaryEmail: z.string().email('Invalid email address').trim().toLowerCase().optional(),
  primaryPhone: z.string().min(6, 'Phone must be at least 6 characters').trim().optional(),
  gstNumber: z.string().trim().toUpperCase().optional(),
  mainBranchName: z.string().min(2).max(100).trim().optional(),
  mainBranchAddress: z.object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
  }).optional(),

  // Owner fields (required)
  ownerName: z.string().min(2, 'Owner name is required').max(100).trim(),
  ownerEmail: z.string().email('Invalid owner email').trim().toLowerCase(),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// Schema for updating organization (PATCH)
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  primaryEmail: z.string().email().trim().toLowerCase().optional(),
  primaryPhone: z.string().min(6).trim().optional(),
  secondaryEmail: z.string().email().trim().toLowerCase().optional(),
  secondaryPhone: z.string().min(6).trim().optional(),
  gstNumber: z.string().trim().toUpperCase().optional(),
  uniqueShopId: z.string().min(2).max(30).trim().optional(),
  logo: z.string().url().optional(),
  address: z.object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
  }).optional(),
  settings: z.object({
    currency: z.string().length(3).toUpperCase().optional(),
    timezone: z.string().optional(),
    financialYearStart: z.string().optional(),
  }).optional(),
  platformDelivery: z.object({
    enabled: z.boolean(),
  }).optional(),
}).strict();

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

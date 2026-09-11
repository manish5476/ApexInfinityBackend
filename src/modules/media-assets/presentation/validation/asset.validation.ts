import { z } from 'zod';

export const assetCategorySchema = z.enum([
  'product',
  'avatar',
  'invoice',
  'chat',
  'marketing',
]);

export const uploadAssetSchema = z.object({
  category: assetCategorySchema.optional().default('marketing'),
});

export const queryAssetsSchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 20)),
  search: z.string().optional(),
  category: assetCategorySchema.optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

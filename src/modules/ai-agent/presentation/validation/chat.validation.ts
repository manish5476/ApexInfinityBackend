import { z } from 'zod';

export const aiMessageSchema = z.object({
  message: z.string().min(1).trim(),
});

export const createChannelSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['public', 'private', 'dm']).optional().default('public'),
  members: z.array(z.string()).optional(),
});

export const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  body: z.string().optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      type: z.string().optional(),
      size: z.number().optional(),
      publicId: z.string().optional(),
      assetId: z.string().optional(),
    }),
  ).optional(),
});

export const editMessageSchema = z.object({
  body: z.string().min(1).trim(),
});

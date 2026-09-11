import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
//  Field Service — Zod validation schemas
// ─────────────────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).optional();

const slaSchema = z.object({
  responseDeadline:   z.string().datetime().optional(),
  arrivalDeadline:    z.string().datetime().optional(),
  completionDeadline: z.string().datetime().optional(),
}).optional();

const recurrenceRuleSchema = z.object({
  frequency:      z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval:       z.number().int().min(1).default(1),
  daysOfWeek:     z.array(z.number().int().min(0).max(6)).optional(),
  endDate:        z.string().datetime().optional(),
  maxOccurrences: z.number().int().min(1).optional(),
}).optional();

const inventoryItemSchema = z.object({
  productId: z.string().min(1),
  qty:       z.number().int().min(1),
});

export const createWorkAssignmentSchema = z.object({
  title:                  z.string().min(1).max(200),
  description:            z.string().optional(),
  internalNotes:          z.string().optional(),
  priority:               z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo:             z.array(z.string()).optional(),
  customerId:             z.string().optional(),
  branchId:               z.string().optional(),
  requiredSkills:         z.array(z.string()).optional(),
  location:               locationSchema,
  travelTimeEstimateMins: z.number().int().min(0).optional(),
  scheduledAt:            z.string().datetime().optional(),
  estimatedDurationMins:  z.number().int().min(1).optional(),
  sla:                    slaSchema,
  inventoryItems:         z.array(inventoryItemSchema).optional(),
  recurrenceRule:         recurrenceRuleSchema,
});

export const updateWorkAssignmentSchema = z.object({
  title:                  z.string().min(1).max(200).optional(),
  description:            z.string().optional(),
  internalNotes:          z.string().optional(),
  priority:               z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo:             z.array(z.string()).optional(),
  customerId:             z.string().optional(),
  branchId:               z.string().optional(),
  requiredSkills:         z.array(z.string()).optional(),
  location:               locationSchema,
  travelTimeEstimateMins: z.number().int().min(0).optional(),
  scheduledAt:            z.string().datetime().optional(),
  estimatedDurationMins:  z.number().int().min(1).optional(),
  sla:                    slaSchema,
  scope:                  z.enum(['single', 'future', 'all']).default('single'),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'draft', 'scheduled', 'assigned', 'accepted', 'travelling', 'arrived',
    'working', 'paused', 'waiting_customer', 'waiting_parts', 'testing',
    'completed', 'verified', 'closed', 'cancelled',
  ]),
});

export const completeWorkAssignmentSchema = z.object({
  customerRating:      z.number().int().min(1).max(5).optional(),
  firstVisitResolution: z.boolean().optional(),
  completionRate:      z.number().min(0).max(100).optional(),
  delayReason:         z.string().optional(),
  notes:               z.string().optional(),
});

export type CreateWorkAssignmentDto  = z.infer<typeof createWorkAssignmentSchema>;
export type UpdateWorkAssignmentDto  = z.infer<typeof updateWorkAssignmentSchema>;
export type UpdateStatusDto          = z.infer<typeof updateStatusSchema>;
export type CompleteWorkAssignmentDto = z.infer<typeof completeWorkAssignmentSchema>;

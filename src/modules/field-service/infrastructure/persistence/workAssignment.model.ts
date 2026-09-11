import mongoose, { Schema, Document } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
//  WorkAssignment — Mongoose persistence model
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkAssignmentDoc extends Document {
  title: string;
  description?: string;
  internalNotes?: string;
  status: string;
  priority: string;
  organizationId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  customerId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  requiredSkills: mongoose.Types.ObjectId[];
  location?: { address?: string; lat?: number; lng?: number };
  travelTimeEstimateMins?: number;
  scheduledAt?: Date;
  estimatedDurationMins?: number;
  sla: {
    responseDeadline?: Date;
    arrivalDeadline?: Date;
    completionDeadline?: Date;
    actualArrival?: Date;
    actualCompletion?: Date;
    breached: boolean;
    breachType?: string;
    breachReason?: string;
  };
  inventoryItems: Array<{
    productId: mongoose.Types.ObjectId;
    qty: number;
    reservedAt: Date;
    consumed: boolean;
  }>;
  recurrenceRule?: {
    frequency: string;
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
    maxOccurrences?: number;
  };
  parentAssignment?: mongoose.Types.ObjectId;
  seriesId?: mongoose.Types.ObjectId;
  nextOccurrence?: Date;
  ai: {
    estimatedDuration?: number;
    actualDuration?: number;
    completionRate?: number;
    firstVisitResolution?: boolean;
    customerRating?: number;
    delayReason?: string;
    travelTime?: number;
    energyConsumption?: number;
  };
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const slaSchema = new Schema(
  {
    responseDeadline: Date,
    arrivalDeadline: Date,
    completionDeadline: Date,
    actualArrival: Date,
    actualCompletion: Date,
    breached: { type: Boolean, default: false },
    breachType: { type: String, enum: ['response', 'arrival', 'completion'] },
    breachReason: String,
  },
  { _id: false },
);

const recurrenceRuleSchema = new Schema(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    interval: { type: Number, min: 1, default: 1 },
    daysOfWeek: { type: [Number], default: undefined },
    endDate: Date,
    maxOccurrences: { type: Number, min: 1 },
  },
  { _id: false },
);

const inventoryItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, min: 1, required: true },
    reservedAt: { type: Date, default: Date.now },
    consumed: { type: Boolean, default: false },
  },
  { _id: true },
);

const aiSchema = new Schema(
  {
    estimatedDuration: Number,
    actualDuration: Number,
    completionRate: Number,
    firstVisitResolution: Boolean,
    customerRating: { type: Number, min: 1, max: 5 },
    delayReason: String,
    travelTime: Number,
    energyConsumption: Number,
  },
  { _id: false },
);

// Use untyped Schema to avoid TS2322 on sub-document arrays
const workAssignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'draft', 'scheduled', 'assigned', 'accepted', 'travelling', 'arrived',
        'working', 'paused', 'waiting_customer', 'waiting_parts', 'testing',
        'completed', 'verified', 'closed', 'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    requiredSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    location: {
      address: String,
      lat: Number,
      lng: Number,
    },
    travelTimeEstimateMins: { type: Number, min: 0 },
    scheduledAt: { type: Date, index: true },
    estimatedDurationMins: { type: Number, min: 1 },
    sla: { type: slaSchema, default: {} },
    inventoryItems: { type: [inventoryItemSchema], default: [] },
    recurrenceRule: recurrenceRuleSchema,
    parentAssignment: { type: Schema.Types.ObjectId, ref: 'WorkAssignment' },
    seriesId: { type: Schema.Types.ObjectId, index: true },
    nextOccurrence: Date,
    ai: { type: aiSchema, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Compound indexes ─────────────────────────────────────────────────────────
workAssignmentSchema.index({ organizationId: 1, scheduledAt: 1 });
workAssignmentSchema.index({ organizationId: 1, status: 1 });
workAssignmentSchema.index({ organizationId: 1, assignedTo: 1, scheduledAt: 1 });
workAssignmentSchema.index({ organizationId: 1, seriesId: 1 });
workAssignmentSchema.index({ 'sla.completionDeadline': 1, 'sla.breached': 1 });

export const WorkAssignmentModel = mongoose.model<WorkAssignmentDoc>(
  'WorkAssignment',
  workAssignmentSchema,
);

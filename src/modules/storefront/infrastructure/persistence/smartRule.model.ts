import mongoose, { Schema, Document } from 'mongoose';

export interface ISmartRuleDoc extends Document {
  organizationId: string;
  name: string;
  description?: string;
  ruleType: string;
  filters: Array<{ field: string; operator: string; value: any; value2?: any }>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  cacheDuration: number;
  isActive: boolean;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SmartRuleSchema = new Schema<ISmartRuleDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true },
    ruleType: { type: String, required: true },
    filters: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        value2: { type: Schema.Types.Mixed },
      },
    ],
    sortBy: { type: String, default: 'createdAt' },
    sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
    limit: { type: Number, min: 1, max: 100, default: 12 },
    cacheDuration: { type: Number, default: 15 },
    isActive: { type: Boolean, default: true, index: true },
    lastExecutedAt: { type: Date },
    executionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SmartRuleSchema.index({ organizationId: 1, ruleType: 1 });

export const SmartRuleModel =
  (mongoose.models.SmartRule as mongoose.Model<ISmartRuleDoc>) ||
  mongoose.model<ISmartRuleDoc>('SmartRule', SmartRuleSchema);

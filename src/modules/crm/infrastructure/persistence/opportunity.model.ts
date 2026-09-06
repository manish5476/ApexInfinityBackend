import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunityDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  customerId: string;
  name: string;
  stage: string;
  amount: number;
  currency: string;
  ownerId: string | null;
  expectedCloseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunityDoc>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    stage: { type: String, required: true, default: 'prospecting' },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'INR' },
    ownerId: { type: String, default: null },
    expectedCloseDate: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false, timestamps: false }
);

OpportunitySchema.index({ organizationId: 1, stage: 1 });
OpportunitySchema.index({ organizationId: 1, customerId: 1 });

export const OpportunityModel = mongoose.model<IOpportunityDoc>('CrmOpportunity', OpportunitySchema);

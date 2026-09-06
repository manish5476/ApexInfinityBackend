import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  status: string;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String, default: null },
  status: { type: String, required: true },
  ownerId: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

LeadSchema.index({ organizationId: 1, email: 1 });
LeadSchema.index({ organizationId: 1, ownerId: 1 });

export const LeadModel = mongoose.model<ILeadDoc>('CrmLead', LeadSchema);

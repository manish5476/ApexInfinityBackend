import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontFormSubmissionDoc extends Document {
  organizationId: string;
  formType: 'newsletter' | 'contact';
  visitorName?: string;
  visitorEmail: string;
  visitorPhone?: string;
  message?: string;
  status: 'new' | 'read' | 'replied';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontFormSubmissionSchema = new Schema<IStorefrontFormSubmissionDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    formType: { type: String, enum: ['newsletter', 'contact'], required: true },
    visitorName: { type: String, trim: true },
    visitorEmail: { type: String, required: true, trim: true, lowercase: true },
    visitorPhone: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const StorefrontFormSubmissionModel =
  (mongoose.models.StorefrontFormSubmission as mongoose.Model<IStorefrontFormSubmissionDoc>) ||
  mongoose.model<IStorefrontFormSubmissionDoc>('StorefrontFormSubmission', StorefrontFormSubmissionSchema);

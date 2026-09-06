import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  status: string;
  failureCount: number;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhookDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  secret: { type: String, required: true },
  events: [{ type: String, required: true }],
  isActive: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  failureCount: { type: Number, default: 0 },
  lastTriggeredAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

WebhookSchema.index({ organizationId: 1, isActive: 1 });
WebhookSchema.index({ organizationId: 1, createdAt: -1 });

export const WebhookModel = mongoose.model<IWebhookDoc>('FwWebhook', WebhookSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookDeliveryDoc extends Document<any, any, any> {
  _id: string;
  webhookId: string;
  organizationId: string;
  deliveryId: string;
  event: string;
  isReplay: boolean;
  originalDeliveryId?: string;
  requestUrl: string;
  requestPayload: Record<string, any>;
  requestHeaders: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  responseTimeMs?: number;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: Date | null;
  status: string;
  errorMessage?: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDeliveryDoc>(
  {
    _id: { type: String, required: true },
    webhookId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    deliveryId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    isReplay: { type: Boolean, default: false },
    originalDeliveryId: { type: String },
    requestUrl: { type: String, required: true },
    requestPayload: { type: Schema.Types.Mixed, default: {} },
    requestHeaders: { type: Schema.Types.Mixed, default: {} },
    responseStatus: { type: Number },
    responseBody: { type: String },
    responseTimeMs: { type: Number },
    attempt: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 5 },
    nextRetryAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'retrying', 'abandoned'],
      default: 'pending',
      index: true,
    },
    errorMessage: { type: String },
    errorCode: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

WebhookDeliverySchema.index({ organizationId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ organizationId: 1, status: 1 });

export const WebhookDeliveryModel = mongoose.model<IWebhookDeliveryDoc>('FwWebhookDelivery', WebhookDeliverySchema);

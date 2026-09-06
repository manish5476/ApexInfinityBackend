import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  recipientId: string;
  businessType: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  recipientId: { type: String, required: true },
  businessType: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  priority: { type: String, default: 'normal' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

NotificationSchema.index({ organizationId: 1, recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotificationDoc>('FwNotification', NotificationSchema);

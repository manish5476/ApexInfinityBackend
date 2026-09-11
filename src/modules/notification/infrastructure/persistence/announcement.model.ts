import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  senderId: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  targetRoles: string[];
  targetUsers: string[];
  isPinned: boolean;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDoc>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'urgent'], default: 'info' },
    targetAudience: { type: String, enum: ['all', 'role', 'specific'], default: 'all' },
    targetRoles: [{ type: String }],
    targetUsers: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

AnnouncementSchema.index({ organizationId: 1, isActive: 1, isPinned: -1, createdAt: -1 });

export const AnnouncementModel = mongoose.model<IAnnouncementDoc>('FwAnnouncement', AnnouncementSchema);

export interface IAnnouncementReadDoc extends Document<any, any, any> {
  announcementId: string;
  userId: string;
  readAt: Date;
}

const AnnouncementReadSchema = new Schema<IAnnouncementReadDoc>(
  {
    announcementId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AnnouncementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export const AnnouncementReadModel = mongoose.model<IAnnouncementReadDoc>('FwAnnouncementRead', AnnouncementReadSchema);

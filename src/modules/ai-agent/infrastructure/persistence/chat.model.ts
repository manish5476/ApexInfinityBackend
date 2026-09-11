import mongoose, { Schema, Document } from 'mongoose';

export interface ChannelDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  name?: string;
  type: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, trim: true },
    type: { type: String, enum: ['public', 'private', 'dm'], default: 'public' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

channelSchema.index({ organizationId: 1, members: 1 });

export const ChannelModel = mongoose.model<ChannelDoc>('ChatChannel', channelSchema);

export interface MessageDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  body?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
    publicId?: string;
    assetId?: mongoose.Types.ObjectId;
  }>;
  readBy: mongoose.Types.ObjectId[];
  deleted: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'ChatChannel', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, trim: true },
    attachments: [
      {
        name: String,
        url: String,
        type: { type: String },
        size: Number,
        publicId: String,
        assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deleted: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ organizationId: 1, channelId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<MessageDoc>('ChatMessage', messageSchema);

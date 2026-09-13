import mongoose, { Schema, Document, Connection, Model } from 'mongoose';
import { UserPersistenceData } from '../../application/mappers/UserMapper';

export interface UserDocument extends Document<string>, UserPersistenceData {
  _id: string;
}

export const UserSchema = new Schema<UserDocument>(
  {
    _id: { type: Schema.Types.Mixed, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    organizationId: { type: Schema.Types.Mixed, index: true },
    branchId: { type: Schema.Types.Mixed, index: true },
    role: { type: Schema.Types.Mixed },
    roles: { type: [String], default: ['user'] },
    permissions: { type: [String], default: [] },
    permissionOverrides: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
    isOwner: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive', 'suspended'],
      default: 'pending',
      index: true,
    },
    phone: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, index: true, sparse: true },
    emailVerificationExpires: { type: Date },
    passwordResetTokenHash: { type: String, index: true, sparse: true },
    passwordResetExpires: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
    strict: false,
  }
);

UserSchema.index({ organizationId: 1, email: 1 });
UserSchema.index({ organizationId: 1, phone: 1 });
UserSchema.index({ name: 'text', email: 'text' });

export function getUserModel(connection: Connection): Model<UserDocument> {
  return (
    (connection.models.User as Model<UserDocument>) ||
    connection.model<UserDocument>('User', UserSchema)
  );
}

export const UserModel = (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>('User', UserSchema);


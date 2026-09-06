import { Schema, Document, Connection, Model } from 'mongoose';
import { UserPersistenceData } from '../../application/mappers/UserMapper';

export interface UserDocument extends Document<string>, UserPersistenceData {
  _id: string;
}

export const UserSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    organizationId: { type: String, index: true },
    roles: { type: [String], default: ['user'] },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
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
  }
);

UserSchema.index({ name: 'text', email: 'text' });

export function getUserModel(connection: Connection): Model<UserDocument> {
  return (
    (connection.models.User as Model<UserDocument>) ||
    connection.model<UserDocument>('User', UserSchema)
  );
}

import { Schema, Document, Connection, Model } from 'mongoose';
import { SessionPersistenceData } from '../../application/mappers/SessionMapper';

export interface SessionDocument extends Document<string>, SessionPersistenceData {
  _id: string;
}

export const SessionSchema = new Schema<SessionDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    accessTokenHash: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    previousAccessTokenHash: { type: String, index: true, sparse: true },
    isValid: { type: Boolean, default: true, index: true },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
    ipAddress: { type: String },
    lastActivityAt: { type: Date, required: true },
    lastTokenUpdateAt: { type: Date },
    terminatedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export function getSessionModel(connection: Connection): Model<SessionDocument> {
  return (
    (connection.models.AuthSession as Model<SessionDocument>) ||
    connection.model<SessionDocument>('AuthSession', SessionSchema)
  );
}

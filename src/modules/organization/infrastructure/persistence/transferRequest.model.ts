import { Schema, Document, Connection, Model } from 'mongoose';

export interface TransferRequestDocument extends Document<string> {
  _id: string;
  organizationId: string;
  currentOwner: string;
  newOwner: string;
  tokenHash: string;
  expiresAt: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export const TransferRequestSchema = new Schema<TransferRequestDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    currentOwner: { type: String, required: true },
    newOwner: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export function getTransferRequestModel(connection: Connection): Model<TransferRequestDocument> {
  return (
    (connection.models.TransferRequest as Model<TransferRequestDocument>) ||
    connection.model<TransferRequestDocument>('TransferRequest', TransferRequestSchema)
  );
}

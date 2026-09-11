import { Schema, Document, Connection, Model } from 'mongoose';

export interface PendingReconciliationDocument extends Document<string> {
  _id: string;
  organizationId: string;
  invoiceId?: string;
  customerId?: string;
  amount: number;
  transactionId?: string;
  gateway?: string;
  paymentMethod?: string;
  status: 'pending' | 'matched' | 'disputed' | 'cancelled';
  matchedEmiId?: string;
  matchedInstallments?: number[];
  reconciledBy?: string;
  reconciledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PendingReconciliationSchema = new Schema<PendingReconciliationDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    invoiceId: { type: String, index: true },
    customerId: { type: String, index: true },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    gateway: { type: String },
    paymentMethod: { type: String },
    status: {
      type: String,
      enum: ['pending', 'matched', 'disputed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    matchedEmiId: { type: String },
    matchedInstallments: { type: [Number], default: [] },
    reconciledBy: { type: String },
    reconciledAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

PendingReconciliationSchema.index({ organizationId: 1, status: 1 });

export function getPendingReconciliationModel(
  connection: Connection
): Model<PendingReconciliationDocument> {
  return (
    (connection.models.PendingReconciliation as Model<PendingReconciliationDocument>) ||
    connection.model<PendingReconciliationDocument>(
      'PendingReconciliation',
      PendingReconciliationSchema
    )
  );
}

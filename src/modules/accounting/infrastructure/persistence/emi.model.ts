import { Schema, Document, Connection, Model } from 'mongoose';

export interface EmiInstallment {
  _id?: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentId?: string;
  paidAt?: Date;
}

export interface EmiDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  invoiceId: string;
  customerId: string;
  totalAmount: number;
  downPayment: number;
  balanceAmount: number;
  numberOfInstallments: number;
  interestRate: number;
  emiStartDate: Date;
  emiEndDate?: Date;
  installments: EmiInstallment[];
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  externalPayments?: Array<{
    transactionId?: string;
    gateway?: string;
    amount?: number;
    paymentDate?: Date;
    reconciledAt?: Date;
    status?: 'pending' | 'reconciled' | 'failed';
  }>;
  advanceBalance: number;
  lastReconciledAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const EmiInstallmentSchema = new Schema<EmiInstallment>({
  installmentNumber: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  principalAmount: { type: Number, required: true },
  interestAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
  },
  paymentId: { type: String, default: null },
  paidAt: { type: Date, default: null },
});

export const EmiSchema = new Schema<EmiDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String },
    invoiceId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    totalAmount: { type: Number, required: true },
    downPayment: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    numberOfInstallments: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    emiStartDate: { type: Date, required: true },
    emiEndDate: { type: Date },
    installments: [EmiInstallmentSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'defaulted', 'cancelled'],
      default: 'active',
    },
    externalPayments: [
      {
        transactionId: String,
        gateway: String,
        amount: Number,
        paymentDate: Date,
        reconciledAt: Date,
        status: {
          type: String,
          enum: ['pending', 'reconciled', 'failed'],
          default: 'pending',
        },
      },
    ],
    advanceBalance: { type: Number, default: 0 },
    lastReconciledAt: Date,
    createdBy: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

EmiSchema.index({ organizationId: 1, invoiceId: 1 });
EmiSchema.index({ organizationId: 1, status: 1 });

export function getEmiModel(connection: Connection): Model<EmiDocument> {
  return (
    (connection.models.EMI as Model<EmiDocument>) ||
    connection.model<EmiDocument>('EMI', EmiSchema)
  );
}

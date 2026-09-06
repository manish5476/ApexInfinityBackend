import { Schema, Document, Connection, Model } from 'mongoose';

export interface ExpenseClaimDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  claimNumber: string;
  title: string;
  currency: string;
  items: Array<{
    category: string;
    description?: string;
    expenseDate: Date;
    amount: number;
    taxAmount?: number;
    receiptUrl?: string;
  }>;
  totalAmount: number;
  approvedAmount: number;
  status: string;
  approvalFlow: Array<{
    approver: string;
    level: number;
    status: string;
    comments?: string;
    actionAt?: Date;
  }>;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reimbursedAt?: Date;
  payslipId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseClaimSchema = new Schema<ExpenseClaimDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeId: { type: String, index: true },
    claimNumber: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    currency: { type: String, default: 'INR' },
    items: [
      {
        _id: false,
        category: { type: String, required: true },
        description: { type: String },
        expenseDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        taxAmount: { type: Number, default: 0 },
        receiptUrl: { type: String },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    approvedAmount: { type: Number, default: 0 },
    status: { type: String, default: 'draft', index: true },
    approvalFlow: [
      {
        _id: false,
        approver: { type: String, required: true },
        level: { type: Number, required: true },
        status: { type: String, required: true },
        comments: { type: String },
        actionAt: { type: Date },
      },
    ],
    submittedAt: { type: Date },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    reimbursedAt: { type: Date },
    payslipId: { type: String },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

expenseClaimSchema.index({ organizationId: 1, userId: 1, status: 1 });
expenseClaimSchema.index({ organizationId: 1, claimNumber: 1 }, { unique: true });

export function getExpenseClaimModel(connection: Connection): Model<ExpenseClaimDocument> {
  return connection.models['ExpenseClaim'] || connection.model<ExpenseClaimDocument>('ExpenseClaim', expenseClaimSchema);
}

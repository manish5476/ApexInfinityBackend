import { Schema, Document, Connection, Model } from 'mongoose';

export interface PayslipDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  salaryStructureId?: string;
  payslipNumber: string;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  attendanceSnapshot: {
    paidDays: number;
    presentDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
    lateCount: number;
  };
  earnings: Array<{ code: string; name: string; amount: number; taxable?: boolean }>;
  deductions: Array<{ code: string; name: string; amount: number; taxable?: boolean }>;
  reimbursements: Array<{ code: string; name: string; amount: number }>;
  grossPay: number;
  deductionTotal: number;
  reimbursementTotal: number;
  netPay: number;
  currency: string;
  paymentStatus: string;
  paidAt?: Date;
  paymentMode?: string;
  referenceNo?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payLineSchema = {
  _id: false,
  code: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  taxable: { type: Boolean, default: true },
};

const payslipSchema = new Schema<PayslipDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeId: { type: String, index: true },
    salaryStructureId: { type: String },
    payslipNumber: { type: String, required: true },
    month: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    attendanceSnapshot: {
      paidDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      lateCount: { type: Number, default: 0 },
    },
    earnings: [payLineSchema],
    deductions: [payLineSchema],
    reimbursements: [payLineSchema],
    grossPay: { type: Number, default: 0 },
    deductionTotal: { type: Number, default: 0 },
    reimbursementTotal: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, default: 'pending', index: true },
    paidAt: { type: Date },
    paymentMode: { type: String },
    referenceNo: { type: String },
    status: { type: String, default: 'draft', index: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    lockedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

payslipSchema.index({ organizationId: 1, userId: 1, month: 1, year: 1 }, { unique: true });
payslipSchema.index({ organizationId: 1, payslipNumber: 1 }, { unique: true });

export function getPayslipModel(connection: Connection): Model<PayslipDocument> {
  return connection.models['Payslip'] || connection.model<PayslipDocument>('Payslip', payslipSchema);
}

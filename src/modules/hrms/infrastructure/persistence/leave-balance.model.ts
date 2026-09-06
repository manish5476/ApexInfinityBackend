import { Schema, Document, Connection, Model } from 'mongoose';

export interface LeaveBalanceDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  financialYear: string;
  casualLeave: { total: number; used: number };
  sickLeave: { total: number; used: number };
  earnedLeave: { total: number; used: number };
  compensatoryOff: { total: number; used: number };
  paidLeave: { total: number; used: number };
  unpaidLeave: { total: number; used: number };
  marriageLeave: { total: number; used: number };
  paternityLeave: { total: number; used: number };
  maternityLeave: { total: number; used: number };
  bereavementLeave: { total: number; used: number };
  lastAccruedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bucketSchema = {
  _id: false,
  total: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
};

const leaveBalanceSchema = new Schema<LeaveBalanceDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    financialYear: { type: String, required: true, index: true },
    casualLeave: { type: bucketSchema, default: () => ({ total: 12, used: 0 }) },
    sickLeave: { type: bucketSchema, default: () => ({ total: 10, used: 0 }) },
    earnedLeave: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    compensatoryOff: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    paidLeave: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    unpaidLeave: { type: bucketSchema, default: () => ({ total: 9999, used: 0 }) },
    marriageLeave: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    paternityLeave: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    maternityLeave: { type: bucketSchema, default: () => ({ total: 84, used: 0 }) },
    bereavementLeave: { type: bucketSchema, default: () => ({ total: 0, used: 0 }) },
    lastAccruedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

leaveBalanceSchema.index({ organizationId: 1, userId: 1, financialYear: 1 }, { unique: true });

export function getLeaveBalanceModel(connection: Connection): Model<LeaveBalanceDocument> {
  return connection.models['LeaveBalance'] || connection.model<LeaveBalanceDocument>('LeaveBalance', leaveBalanceSchema);
}

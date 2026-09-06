import { Schema, Document, Connection, Model } from 'mongoose';

export interface LeaveRequestDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeRef?: string;
  departmentId?: string;
  assignedApprover: string;
  leaveRequestId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  startSession: string;
  endSession: string;
  reason: string;
  status: string;
  approvalFlow: Array<{
    approver: string;
    level: number;
    status: string;
    comments?: string;
    actionAt?: Date;
  }>;
  escalatedTo?: string;
  escalatedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<LeaveRequestDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeRef: { type: String, index: true },
    departmentId: { type: String, index: true },
    assignedApprover: { type: String, required: true, index: true },
    leaveRequestId: { type: String, required: true },
    leaveType: { type: String, required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    daysCount: { type: Number, required: true },
    startSession: { type: String, default: 'full' },
    endSession: { type: String, default: 'full' },
    reason: { type: String, required: true, trim: true },
    status: { type: String, default: 'pending', index: true },
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
    escalatedTo: { type: String },
    escalatedReason: { type: String },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

leaveRequestSchema.index({ organizationId: 1, userId: 1, status: 1 });
leaveRequestSchema.index({ organizationId: 1, leaveRequestId: 1 }, { unique: true });

export function getLeaveRequestModel(connection: Connection): Model<LeaveRequestDocument> {
  return connection.models['LeaveRequest'] || connection.model<LeaveRequestDocument>('LeaveRequest', leaveRequestSchema);
}

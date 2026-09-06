import { Schema, Document, Connection, Model } from 'mongoose';

export interface AttendanceRequestDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  type: string;
  date: Date;
  requestedFirstIn?: Date;
  requestedLastOut?: Date;
  reason: string;
  status: string;
  assignedApprover: string;
  actionBy?: string;
  actionAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRequestSchema = new Schema<AttendanceRequestDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeId: { type: String, index: true },
    type: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    requestedFirstIn: { type: Date },
    requestedLastOut: { type: Date },
    reason: { type: String, required: true, trim: true },
    status: { type: String, default: 'pending', index: true },
    assignedApprover: { type: String, required: true, index: true },
    actionBy: { type: String },
    actionAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

attendanceRequestSchema.index({ organizationId: 1, userId: 1, status: 1 });

export function getAttendanceRequestModel(connection: Connection): Model<AttendanceRequestDocument> {
  return connection.models['AttendanceRequest'] || connection.model<AttendanceRequestDocument>('AttendanceRequest', attendanceRequestSchema);
}

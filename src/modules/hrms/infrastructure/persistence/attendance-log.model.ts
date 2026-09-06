import { Schema, Document, Connection, Model } from 'mongoose';

export interface AttendanceLogDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  machineId?: string;
  source: string;
  type: string;
  timestamp: Date;
  serverTimestamp: Date;
  ipAddress?: string;
  deviceId?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    geofenceStatus?: string;
    geofenceId?: string;
  };
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  isFlagged: boolean;
  flagReason?: string;
  flaggedBy?: string;
  isCorrected: boolean;
  correctionNotes?: string;
  correctedBy?: string;
  processingStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceLogSchema = new Schema<AttendanceLogDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeId: { type: String, index: true },
    machineId: { type: String, index: true },
    source: { type: String, required: true },
    type: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    serverTimestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    deviceId: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      geofenceStatus: { type: String },
      geofenceId: { type: String },
    },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    flaggedBy: { type: String },
    isCorrected: { type: Boolean, default: false },
    correctionNotes: { type: String },
    correctedBy: { type: String },
    processingStatus: { type: String, default: 'pending', index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

attendanceLogSchema.index({ organizationId: 1, userId: 1, timestamp: -1 });

export function getAttendanceLogModel(connection: Connection): Model<AttendanceLogDocument> {
  return connection.models['AttendanceLog'] || connection.model<AttendanceLogDocument>('AttendanceLog', attendanceLogSchema);
}

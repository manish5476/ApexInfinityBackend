import { Schema, Connection, Model } from 'mongoose';

export interface AttendanceMachineDocument {
  _id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  providerType: string;
  ipAddress?: string;
  port?: number;
  status: string;
  connectionStatus: string;
  lastSyncAt?: Date;
  lastPingAt?: Date;
  apiKey: string;
  userMappings: Array<{
    machineUserId: string;
    userId: string;
    mappedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceMachineSchema = new Schema<AttendanceMachineDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    providerType: { type: String, default: 'generic' },
    ipAddress: { type: String, trim: true },
    port: { type: Number },
    status: { type: String, default: 'active', index: true },
    connectionStatus: { type: String, default: 'disconnected' },
    lastSyncAt: { type: Date },
    lastPingAt: { type: Date },
    apiKey: { type: String, required: true, index: true },
    userMappings: [
      {
        _id: false,
        machineUserId: { type: String, required: true },
        userId: { type: String, required: true },
        mappedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

attendanceMachineSchema.index({ organizationId: 1, serialNumber: 1 }, { unique: true });

export function getAttendanceMachineModel(connection: Connection): Model<AttendanceMachineDocument> {
  return connection.models['AttendanceMachine'] || connection.model<AttendanceMachineDocument>('AttendanceMachine', attendanceMachineSchema);
}

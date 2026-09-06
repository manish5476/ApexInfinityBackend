import { Schema, Document, Connection, Model } from 'mongoose';

export interface AttendanceDailyDocument extends Document<string> {
  _id: string;
  organizationId: string;
  employeeId: string;
  date: Date;
  shiftId?: string;
  firstIn?: Date;
  lastOut?: Date;
  totalWorkHours: number;
  isLate: boolean;
  lateMinutes: number;
  status: string;
  punches: {
    type: 'in' | 'out';
    timestamp: Date;
    deviceId?: string;
    source?: string;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceDailySchema = new Schema<AttendanceDailyDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    shiftId: { type: String },
    firstIn: { type: Date },
    lastOut: { type: Date },
    totalWorkHours: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekly_off'],
      default: 'absent',
      index: true,
    },
    punches: [
      {
        type: { type: String, enum: ['in', 'out'], required: true },
        timestamp: { type: Date, required: true },
        deviceId: { type: String },
        source: { type: String, default: 'web' },
      },
    ],
    notes: { type: String },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

// One daily attendance record per employee per date in a tenant
attendanceDailySchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceDailySchema.index({ organizationId: 1, date: 1, status: 1 });

export function getAttendanceDailyModel(connection: Connection): Model<AttendanceDailyDocument> {
  return connection.models['AttendanceDaily'] || connection.model<AttendanceDailyDocument>('AttendanceDaily', attendanceDailySchema);
}

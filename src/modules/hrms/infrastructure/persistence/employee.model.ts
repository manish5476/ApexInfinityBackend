import { Schema, Document, Connection, Model } from 'mongoose';

export interface EmployeeDoc extends Document<string> {
  _id: string;
  organizationId: string;
  employeeCode: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  joiningDate: Date;
  workMode: string;
  employmentType: string;
  status: string;
  exitDate?: Date;
  shiftId?: string;
  allowWebPunch: boolean;
  biometricId?: string;
  bankDetails?: {
    panNumber?: string;
    uanNumber?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<EmployeeDoc>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    employeeCode: { type: String, required: true, trim: true },
    userId: { type: String, trim: true, sparse: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    departmentId: { type: String, index: true },
    designationId: { type: String },
    reportingManagerId: { type: String },
    joiningDate: { type: Date, default: Date.now },
    workMode: { type: String, enum: ['on_site', 'remote', 'hybrid'], default: 'on_site' },
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
    status: {
      type: String,
      enum: ['active', 'probation', 'notice_period', 'resigned', 'terminated'],
      default: 'active',
      index: true,
    },
    exitDate: { type: Date },
    shiftId: { type: String },
    allowWebPunch: { type: Boolean, default: true },
    biometricId: { type: String, trim: true },
    bankDetails: {
      panNumber: { type: String, trim: true },
      uanNumber: { type: String, trim: true },
      bankAccountNumber: { type: String, trim: true },
      bankIfsc: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

// Multi-tenant compound unique indexes
employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, userId: 1 }, { sparse: true });
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ organizationId: 1, departmentId: 1 });

export function getEmployeeModel(connection: Connection): Model<EmployeeDoc> {
  return connection.models['Employee'] || connection.model<EmployeeDoc>('Employee', employeeSchema);
}

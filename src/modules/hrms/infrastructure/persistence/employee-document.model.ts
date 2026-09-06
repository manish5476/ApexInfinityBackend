import { Schema, Document, Connection, Model } from 'mongoose';

export interface EmployeeDocumentDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId?: string;
  employeeRef?: string;
  documentType: string;
  documentNumber?: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  expiryDate?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeDocumentSchema = new Schema<EmployeeDocumentDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, index: true },
    employeeRef: { type: String, index: true },
    documentType: { type: String, required: true, index: true },
    documentNumber: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    status: { type: String, default: 'pending', index: true },
    expiryDate: { type: Date },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    verificationNotes: { type: String },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

employeeDocumentSchema.index({ organizationId: 1, userId: 1, documentType: 1 });

export function getEmployeeDocumentModel(connection: Connection): Model<EmployeeDocumentDocument> {
  return connection.models['EmployeeDocument'] || connection.model<EmployeeDocumentDocument>('EmployeeDocument', employeeDocumentSchema);
}

import { Schema, Document, Connection, Model } from 'mongoose';

export interface SalaryStructureDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  structureCode?: string;
  title: string;
  currency: string;
  payFrequency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: string;
  components: Array<{
    name: string;
    code: string;
    category: string;
    calculationType: string;
    amount: number;
    percentageOf?: string;
    taxable: boolean;
    affectsPF: boolean;
    affectsESI: boolean;
    isVariable: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const salaryStructureSchema = new Schema<SalaryStructureDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    employeeId: { type: String, index: true },
    structureCode: { type: String, uppercase: true },
    title: { type: String, required: true, trim: true },
    currency: { type: String, default: 'INR' },
    payFrequency: { type: String, default: 'monthly' },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    status: { type: String, default: 'draft', index: true },
    components: [
      {
        _id: false,
        name: { type: String, required: true },
        code: { type: String, required: true, uppercase: true },
        category: { type: String, required: true },
        calculationType: { type: String, default: 'fixed' },
        amount: { type: Number, default: 0 },
        percentageOf: { type: String },
        taxable: { type: Boolean, default: true },
        affectsPF: { type: Boolean, default: false },
        affectsESI: { type: Boolean, default: false },
        isVariable: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

salaryStructureSchema.index({ organizationId: 1, userId: 1, status: 1 });

export function getSalaryStructureModel(connection: Connection): Model<SalaryStructureDocument> {
  return connection.models['SalaryStructure'] || connection.model<SalaryStructureDocument>('SalaryStructure', salaryStructureSchema);
}

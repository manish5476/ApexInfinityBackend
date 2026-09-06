import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { AssetCategory, AssetCondition, AssetStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface AssetAssignmentRecord {
  user?: string;
  employeeRef?: string;
  assignedAt: Date;
  returnedAt?: Date;
  conditionOnIssue?: string;
  conditionOnReturn?: string;
  notes?: string;
  processedBy?: string;
}

export interface CompanyAssetProps {
  organizationId: string;
  branchId?: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiresAt?: Date;
  condition: AssetCondition;
  status: AssetStatus;
  assignedTo?: string;
  employeeRef?: string;
  assignedAt?: Date;
  returnedAt?: Date;
  assignmentHistory: AssetAssignmentRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyAsset extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _assetCode: string;
  private _name: string;
  private _category: AssetCategory;
  private _serialNumber?: string;
  private _manufacturer?: string;
  private _model?: string;
  private _purchaseDate?: Date;
  private _purchaseCost?: number;
  private _warrantyExpiresAt?: Date;
  private _condition: AssetCondition;
  private _status: AssetStatus;
  private _assignedTo?: string;
  private _employeeRef?: string;
  private _assignedAt?: Date;
  private _returnedAt?: Date;
  private _assignmentHistory: AssetAssignmentRecord[];
  private _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: CompanyAssetProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._assetCode = props.assetCode;
    this._name = props.name;
    this._category = props.category;
    this._serialNumber = props.serialNumber;
    this._manufacturer = props.manufacturer;
    this._model = props.model;
    this._purchaseDate = props.purchaseDate;
    this._purchaseCost = props.purchaseCost;
    this._warrantyExpiresAt = props.warrantyExpiresAt;
    this._condition = props.condition;
    this._status = props.status;
    this._assignedTo = props.assignedTo;
    this._employeeRef = props.employeeRef;
    this._assignedAt = props.assignedAt;
    this._returnedAt = props.returnedAt;
    this._assignmentHistory = props.assignmentHistory;
    this._notes = props.notes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    assetCode: string;
    name: string;
    category: AssetCategory;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    purchaseDate?: Date;
    purchaseCost?: number;
    warrantyExpiresAt?: Date;
    condition?: AssetCondition;
    notes?: string;
  }): CompanyAsset {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for company asset.');
    }
    if (!params.assetCode || params.assetCode.trim().length === 0) {
      throw new DomainError('Asset code cannot be empty.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Asset name cannot be empty.');
    }

    const now = new Date();
    return new CompanyAsset(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      assetCode: params.assetCode.trim().toUpperCase(),
      name: params.name.trim(),
      category: params.category,
      serialNumber: params.serialNumber?.trim(),
      manufacturer: params.manufacturer?.trim(),
      model: params.model?.trim(),
      purchaseDate: params.purchaseDate,
      purchaseCost: params.purchaseCost,
      warrantyExpiresAt: params.warrantyExpiresAt,
      condition: params.condition ?? 'good',
      status: 'available',
      assignmentHistory: [],
      notes: params.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: CompanyAssetProps): CompanyAsset {
    return new CompanyAsset(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get branchId(): string | undefined {
    return this._branchId;
  }

  public get assetCode(): string {
    return this._assetCode;
  }

  public get name(): string {
    return this._name;
  }

  public get category(): AssetCategory {
    return this._category;
  }

  public get serialNumber(): string | undefined {
    return this._serialNumber;
  }

  public get manufacturer(): string | undefined {
    return this._manufacturer;
  }

  public get model(): string | undefined {
    return this._model;
  }

  public get purchaseDate(): Date | undefined {
    return this._purchaseDate;
  }

  public get purchaseCost(): number | undefined {
    return this._purchaseCost;
  }

  public get warrantyExpiresAt(): Date | undefined {
    return this._warrantyExpiresAt;
  }

  public get condition(): AssetCondition {
    return this._condition;
  }

  public get status(): AssetStatus {
    return this._status;
  }

  public get assignedTo(): string | undefined {
    return this._assignedTo;
  }

  public get employeeRef(): string | undefined {
    return this._employeeRef;
  }

  public get assignedAt(): Date | undefined {
    return this._assignedAt;
  }

  public get returnedAt(): Date | undefined {
    return this._returnedAt;
  }

  public get assignmentHistory(): ReadonlyArray<AssetAssignmentRecord> {
    return this._assignmentHistory;
  }

  public get notes(): string | undefined {
    return this._notes;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    name?: string;
    category?: AssetCategory;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    purchaseDate?: Date;
    purchaseCost?: number;
    warrantyExpiresAt?: Date;
    condition?: AssetCondition;
    notes?: string;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.category !== undefined) this._category = params.category;
    if (params.serialNumber !== undefined) this._serialNumber = params.serialNumber.trim();
    if (params.manufacturer !== undefined) this._manufacturer = params.manufacturer.trim();
    if (params.model !== undefined) this._model = params.model.trim();
    if (params.purchaseDate !== undefined) this._purchaseDate = params.purchaseDate;
    if (params.purchaseCost !== undefined) this._purchaseCost = params.purchaseCost;
    if (params.warrantyExpiresAt !== undefined) this._warrantyExpiresAt = params.warrantyExpiresAt;
    if (params.condition !== undefined) this._condition = params.condition;
    if (params.notes !== undefined) this._notes = params.notes.trim();
    this._updatedAt = new Date();
  }

  public assign(userId: string, employeeId?: string, processedBy?: string, conditionOnIssue?: string, notes?: string): void {
    if (this._status !== 'available') {
      throw new DomainError(`Asset cannot be assigned while status is '${this._status}'.`);
    }
    const now = new Date();
    this._assignedTo = userId;
    this._employeeRef = employeeId;
    this._assignedAt = now;
    this._returnedAt = undefined;
    this._status = 'assigned';
    this._assignmentHistory.push({
      user: userId,
      employeeRef: employeeId,
      assignedAt: now,
      conditionOnIssue: conditionOnIssue ?? this._condition,
      notes,
      processedBy,
    });
    this._updatedAt = now;
  }

  public return(conditionOnReturn?: AssetCondition, notes?: string, processedBy?: string): void {
    if (this._status !== 'assigned') {
      throw new DomainError(`Asset cannot be returned while status is '${this._status}'.`);
    }
    const now = new Date();
    const lastRecord = this._assignmentHistory[this._assignmentHistory.length - 1];
    if (lastRecord) {
      lastRecord.returnedAt = now;
      lastRecord.conditionOnReturn = conditionOnReturn ?? this._condition;
      if (notes) lastRecord.notes = (lastRecord.notes ? lastRecord.notes + '; ' : '') + notes;
    }
    if (conditionOnReturn) this._condition = conditionOnReturn;
    this._status = 'available';
    this._returnedAt = now;
    this._assignedTo = undefined;
    this._employeeRef = undefined;
    this._updatedAt = now;
  }
}

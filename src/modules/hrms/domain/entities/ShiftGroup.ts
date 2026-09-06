import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export interface ShiftGroupShift {
  shiftId: string;
  sequence: number;
  color?: string;
}

export interface ShiftRotationPattern {
  dayOffset: number;
  shiftId: string;
}

export interface ShiftGroupProps {
  organizationId: string;
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  shifts: ShiftGroupShift[];
  rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  rotationPattern: ShiftRotationPattern[];
  applicableDepartments: string[];
  applicableDesignations: string[];
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ShiftGroup extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _name: string;
  private _code: string;
  private _description?: string;
  private _shifts: ShiftGroupShift[];
  private _rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  private _rotationPattern: ShiftRotationPattern[];
  private _applicableDepartments: string[];
  private _applicableDesignations: string[];
  private _isActive: boolean;
  private _effectiveFrom?: Date;
  private _effectiveTo?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ShiftGroupProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._name = props.name;
    this._code = props.code;
    this._description = props.description;
    this._shifts = props.shifts;
    this._rotationType = props.rotationType;
    this._rotationPattern = props.rotationPattern;
    this._applicableDepartments = props.applicableDepartments;
    this._applicableDesignations = props.applicableDesignations;
    this._isActive = props.isActive;
    this._effectiveFrom = props.effectiveFrom;
    this._effectiveTo = props.effectiveTo;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    name: string;
    code: string;
    description?: string;
    shifts?: ShiftGroupShift[];
    rotationType?: 'daily' | 'weekly' | 'monthly' | 'custom';
    rotationPattern?: ShiftRotationPattern[];
    applicableDepartments?: string[];
    applicableDesignations?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): ShiftGroup {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for shift group.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Shift group name cannot be empty.');
    }
    if (!params.code || params.code.trim().length === 0) {
      throw new DomainError('Shift group code cannot be empty.');
    }

    const now = new Date();
    return new ShiftGroup(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      name: params.name.trim(),
      code: params.code.trim().toUpperCase(),
      description: params.description?.trim(),
      shifts: params.shifts ?? [],
      rotationType: params.rotationType ?? 'weekly',
      rotationPattern: params.rotationPattern ?? [],
      applicableDepartments: params.applicableDepartments ?? [],
      applicableDesignations: params.applicableDesignations ?? [],
      isActive: true,
      effectiveFrom: params.effectiveFrom,
      effectiveTo: params.effectiveTo,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: ShiftGroupProps): ShiftGroup {
    return new ShiftGroup(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get branchId(): string | undefined {
    return this._branchId;
  }

  public get name(): string {
    return this._name;
  }

  public get code(): string {
    return this._code;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get shifts(): ReadonlyArray<ShiftGroupShift> {
    return this._shifts;
  }

  public get rotationType(): 'daily' | 'weekly' | 'monthly' | 'custom' {
    return this._rotationType;
  }

  public get rotationPattern(): ReadonlyArray<ShiftRotationPattern> {
    return this._rotationPattern;
  }

  public get applicableDepartments(): ReadonlyArray<string> {
    return this._applicableDepartments;
  }

  public get applicableDesignations(): ReadonlyArray<string> {
    return this._applicableDesignations;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get effectiveFrom(): Date | undefined {
    return this._effectiveFrom;
  }

  public get effectiveTo(): Date | undefined {
    return this._effectiveTo;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    name?: string;
    code?: string;
    description?: string;
    shifts?: ShiftGroupShift[];
    rotationType?: 'daily' | 'weekly' | 'monthly' | 'custom';
    rotationPattern?: ShiftRotationPattern[];
    applicableDepartments?: string[];
    applicableDesignations?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.code !== undefined) {
      if (!params.code.trim()) throw new DomainError('Code cannot be empty.');
      this._code = params.code.trim().toUpperCase();
    }
    if (params.description !== undefined) this._description = params.description.trim();
    if (params.shifts !== undefined) this._shifts = [...params.shifts];
    if (params.rotationType !== undefined) this._rotationType = params.rotationType;
    if (params.rotationPattern !== undefined) this._rotationPattern = [...params.rotationPattern];
    if (params.applicableDepartments !== undefined) this._applicableDepartments = [...params.applicableDepartments];
    if (params.applicableDesignations !== undefined) this._applicableDesignations = [...params.applicableDesignations];
    if (params.effectiveFrom !== undefined) this._effectiveFrom = params.effectiveFrom;
    if (params.effectiveTo !== undefined) this._effectiveTo = params.effectiveTo;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }
}

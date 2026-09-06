import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import {
  SalaryComponentCategory,
  CalculationType,
  PayFrequency,
  SalaryStructureStatus,
} from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface SalaryComponent {
  name: string;
  code: string;
  category: SalaryComponentCategory;
  calculationType: CalculationType;
  amount: number;
  percentageOf?: string;
  taxable: boolean;
  affectsPF: boolean;
  affectsESI: boolean;
  isVariable: boolean;
}

export interface SalaryStructureProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  structureCode?: string;
  title: string;
  currency: string;
  payFrequency: PayFrequency;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: SalaryStructureStatus;
  components: SalaryComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export class SalaryStructure extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeId?: string;
  private _structureCode?: string;
  private _title: string;
  private _currency: string;
  private _payFrequency: PayFrequency;
  private _effectiveFrom: Date;
  private _effectiveTo?: Date;
  private _status: SalaryStructureStatus;
  private _components: SalaryComponent[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: SalaryStructureProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeId = props.employeeId;
    this._structureCode = props.structureCode;
    this._title = props.title;
    this._currency = props.currency;
    this._payFrequency = props.payFrequency;
    this._effectiveFrom = props.effectiveFrom;
    this._effectiveTo = props.effectiveTo;
    this._status = props.status;
    this._components = props.components;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeId?: string;
    structureCode?: string;
    title: string;
    currency?: string;
    payFrequency?: PayFrequency;
    effectiveFrom: Date;
    effectiveTo?: Date;
    components?: SalaryComponent[];
  }): SalaryStructure {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for salary structure.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for salary structure.');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new DomainError('Title cannot be empty.');
    }

    const now = new Date();
    return new SalaryStructure(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeId: params.employeeId,
      structureCode: params.structureCode?.trim().toUpperCase(),
      title: params.title.trim(),
      currency: params.currency ?? 'INR',
      payFrequency: params.payFrequency ?? 'monthly',
      effectiveFrom: params.effectiveFrom,
      effectiveTo: params.effectiveTo,
      status: 'draft',
      components: params.components ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: SalaryStructureProps): SalaryStructure {
    return new SalaryStructure(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get branchId(): string | undefined {
    return this._branchId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get employeeId(): string | undefined {
    return this._employeeId;
  }

  public get structureCode(): string | undefined {
    return this._structureCode;
  }

  public get title(): string {
    return this._title;
  }

  public get currency(): string {
    return this._currency;
  }

  public get payFrequency(): PayFrequency {
    return this._payFrequency;
  }

  public get effectiveFrom(): Date {
    return this._effectiveFrom;
  }

  public get effectiveTo(): Date | undefined {
    return this._effectiveTo;
  }

  public get status(): SalaryStructureStatus {
    return this._status;
  }

  public get components(): ReadonlyArray<SalaryComponent> {
    return this._components;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get grossMonthly(): number {
    return this._components
      .filter((c) => c.category === 'earning' || c.category === 'benefit')
      .reduce((sum, c) => sum + (c.calculationType === 'fixed' ? c.amount : 0), 0);
  }

  public get deductionTotal(): number {
    return this._components
      .filter((c) => c.category === 'deduction')
      .reduce((sum, c) => sum + (c.calculationType === 'fixed' ? c.amount : 0), 0);
  }

  public get netMonthly(): number {
    return Math.max(0, this.grossMonthly - this.deductionTotal);
  }

  public updateDetails(params: {
    title?: string;
    structureCode?: string;
    payFrequency?: PayFrequency;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    components?: SalaryComponent[];
  }): void {
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new DomainError('Title cannot be empty.');
      this._title = params.title.trim();
    }
    if (params.structureCode !== undefined) this._structureCode = params.structureCode.trim().toUpperCase();
    if (params.payFrequency !== undefined) this._payFrequency = params.payFrequency;
    if (params.effectiveFrom !== undefined) this._effectiveFrom = params.effectiveFrom;
    if (params.effectiveTo !== undefined) this._effectiveTo = params.effectiveTo;
    if (params.components !== undefined) this._components = [...params.components];
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  public supersede(): void {
    this._status = 'superseded';
    this._updatedAt = new Date();
  }

  public archive(): void {
    this._status = 'archived';
    this._updatedAt = new Date();
  }
}

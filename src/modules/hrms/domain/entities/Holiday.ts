import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export type HolidayType = 'national' | 'state' | 'festival' | 'company' | 'restricted';

export interface HolidayProps {
  organizationId: string;
  branchId?: string;
  name: string;
  date: Date;
  year: number;
  description?: string;
  holidayType: HolidayType;
  isOptional: boolean;
  recurring?: {
    isRecurring: boolean;
    frequency: 'yearly' | 'monthly';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Holiday extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _name: string;
  private _date: Date;
  private _year: number;
  private _description?: string;
  private _holidayType: HolidayType;
  private _isOptional: boolean;
  private _recurring?: {
    isRecurring: boolean;
    frequency: 'yearly' | 'monthly';
  };
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: HolidayProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._name = props.name;
    this._date = props.date;
    this._year = props.year;
    this._description = props.description;
    this._holidayType = props.holidayType;
    this._isOptional = props.isOptional;
    this._recurring = props.recurring;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    name: string;
    date: Date;
    description?: string;
    holidayType?: HolidayType;
    isOptional?: boolean;
    recurring?: {
      isRecurring: boolean;
      frequency: 'yearly' | 'monthly';
    };
  }): Holiday {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for holiday.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Holiday name cannot be empty.');
    }
    if (!params.date) {
      throw new DomainError('Holiday date is required.');
    }

    const d = new Date(params.date);
    d.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    return new Holiday(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      name: params.name.trim(),
      date: d,
      year: d.getUTCFullYear(),
      description: params.description?.trim(),
      holidayType: params.holidayType ?? 'company',
      isOptional: params.isOptional ?? false,
      recurring: params.recurring,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: HolidayProps): Holiday {
    return new Holiday(id, props);
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

  public get date(): Date {
    return this._date;
  }

  public get year(): number {
    return this._year;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get holidayType(): HolidayType {
    return this._holidayType;
  }

  public get isOptional(): boolean {
    return this._isOptional;
  }

  public get recurring(): { isRecurring: boolean; frequency: 'yearly' | 'monthly' } | undefined {
    return this._recurring;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    name?: string;
    date?: Date;
    description?: string;
    holidayType?: HolidayType;
    isOptional?: boolean;
    recurring?: {
      isRecurring: boolean;
      frequency: 'yearly' | 'monthly';
    };
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Holiday name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.date !== undefined) {
      const d = new Date(params.date);
      d.setUTCHours(0, 0, 0, 0);
      this._date = d;
      this._year = d.getUTCFullYear();
    }
    if (params.description !== undefined) this._description = params.description.trim();
    if (params.holidayType !== undefined) this._holidayType = params.holidayType;
    if (params.isOptional !== undefined) this._isOptional = params.isOptional;
    if (params.recurring !== undefined) this._recurring = params.recurring;
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

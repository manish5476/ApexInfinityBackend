import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { LeaveType } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface LeaveBalanceBucket {
  total: number;
  used: number;
}

export interface LeaveBalanceProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  financialYear: string;
  casualLeave: LeaveBalanceBucket;
  sickLeave: LeaveBalanceBucket;
  earnedLeave: LeaveBalanceBucket;
  compensatoryOff: LeaveBalanceBucket;
  paidLeave: LeaveBalanceBucket;
  unpaidLeave: LeaveBalanceBucket;
  marriageLeave: LeaveBalanceBucket;
  paternityLeave: LeaveBalanceBucket;
  maternityLeave: LeaveBalanceBucket;
  bereavementLeave: LeaveBalanceBucket;
  lastAccruedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaveBalance extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _financialYear: string;
  private _casualLeave: LeaveBalanceBucket;
  private _sickLeave: LeaveBalanceBucket;
  private _earnedLeave: LeaveBalanceBucket;
  private _compensatoryOff: LeaveBalanceBucket;
  private _paidLeave: LeaveBalanceBucket;
  private _unpaidLeave: LeaveBalanceBucket;
  private _marriageLeave: LeaveBalanceBucket;
  private _paternityLeave: LeaveBalanceBucket;
  private _maternityLeave: LeaveBalanceBucket;
  private _bereavementLeave: LeaveBalanceBucket;
  private _lastAccruedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: LeaveBalanceProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._financialYear = props.financialYear;
    this._casualLeave = props.casualLeave;
    this._sickLeave = props.sickLeave;
    this._earnedLeave = props.earnedLeave;
    this._compensatoryOff = props.compensatoryOff;
    this._paidLeave = props.paidLeave;
    this._unpaidLeave = props.unpaidLeave;
    this._marriageLeave = props.marriageLeave;
    this._paternityLeave = props.paternityLeave;
    this._maternityLeave = props.maternityLeave;
    this._bereavementLeave = props.bereavementLeave;
    this._lastAccruedAt = props.lastAccruedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    financialYear: string;
    casualLeaveTotal?: number;
    sickLeaveTotal?: number;
    earnedLeaveTotal?: number;
  }): LeaveBalance {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for leave balance.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for leave balance.');
    }
    if (!params.financialYear) {
      throw new DomainError('Financial year is required for leave balance.');
    }

    const now = new Date();
    return new LeaveBalance(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      financialYear: params.financialYear,
      casualLeave: { total: params.casualLeaveTotal ?? 12, used: 0 },
      sickLeave: { total: params.sickLeaveTotal ?? 10, used: 0 },
      earnedLeave: { total: params.earnedLeaveTotal ?? 0, used: 0 },
      compensatoryOff: { total: 0, used: 0 },
      paidLeave: { total: 0, used: 0 },
      unpaidLeave: { total: 9999, used: 0 },
      marriageLeave: { total: 0, used: 0 },
      paternityLeave: { total: 0, used: 0 },
      maternityLeave: { total: 84, used: 0 },
      bereavementLeave: { total: 0, used: 0 },
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: LeaveBalanceProps): LeaveBalance {
    return new LeaveBalance(id, props);
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

  public get financialYear(): string {
    return this._financialYear;
  }

  public get casualLeave(): Readonly<LeaveBalanceBucket> {
    return this._casualLeave;
  }

  public get sickLeave(): Readonly<LeaveBalanceBucket> {
    return this._sickLeave;
  }

  public get earnedLeave(): Readonly<LeaveBalanceBucket> {
    return this._earnedLeave;
  }

  public get compensatoryOff(): Readonly<LeaveBalanceBucket> {
    return this._compensatoryOff;
  }

  public get paidLeave(): Readonly<LeaveBalanceBucket> {
    return this._paidLeave;
  }

  public get unpaidLeave(): Readonly<LeaveBalanceBucket> {
    return this._unpaidLeave;
  }

  public get marriageLeave(): Readonly<LeaveBalanceBucket> {
    return this._marriageLeave;
  }

  public get paternityLeave(): Readonly<LeaveBalanceBucket> {
    return this._paternityLeave;
  }

  public get maternityLeave(): Readonly<LeaveBalanceBucket> {
    return this._maternityLeave;
  }

  public get bereavementLeave(): Readonly<LeaveBalanceBucket> {
    return this._bereavementLeave;
  }

  public get lastAccruedAt(): Date | undefined {
    return this._lastAccruedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  private getBucket(type: LeaveType): LeaveBalanceBucket {
    switch (type) {
      case 'casual': return this._casualLeave;
      case 'sick': return this._sickLeave;
      case 'earned': return this._earnedLeave;
      case 'compensatory': return this._compensatoryOff;
      case 'paid': return this._paidLeave;
      case 'unpaid': return this._unpaidLeave;
      case 'marriage': return this._marriageLeave;
      case 'paternity': return this._paternityLeave;
      case 'maternity': return this._maternityLeave;
      case 'bereavement': return this._bereavementLeave;
      default: return this._paidLeave;
    }
  }

  public getBalance(type: LeaveType): { total: number; used: number; remaining: number } {
    const bucket = this.getBucket(type);
    return {
      total: bucket.total,
      used: bucket.used,
      remaining: Math.max(0, bucket.total - bucket.used),
    };
  }

  public debitLeave(type: LeaveType, amount: number): void {
    if (amount <= 0) throw new DomainError('Debit amount must be greater than zero.');
    const bucket = this.getBucket(type);
    if (type !== 'unpaid' && bucket.used + amount > bucket.total) {
      throw new DomainError(`Insufficient ${type} leave balance. Available: ${bucket.total - bucket.used}, Requested: ${amount}`);
    }
    bucket.used += amount;
    this._updatedAt = new Date();
  }

  public creditLeave(type: LeaveType, amount: number): void {
    if (amount <= 0) throw new DomainError('Credit amount must be greater than zero.');
    const bucket = this.getBucket(type);
    if (bucket.used >= amount) {
      bucket.used -= amount;
    } else {
      const remaining = amount - bucket.used;
      bucket.used = 0;
      bucket.total += remaining;
    }
    this._updatedAt = new Date();
  }

  public accrueMonthly(earnedAmount: number = 1.5): void {
    this._earnedLeave.total += earnedAmount;
    this._lastAccruedAt = new Date();
    this._updatedAt = new Date();
  }

  public updateTotals(updates: Partial<Record<LeaveType, number>>): void {
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        const bucket = this.getBucket(k as LeaveType);
        bucket.total = v;
      }
    }
    this._updatedAt = new Date();
  }
}

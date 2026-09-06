import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { PayslipStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface PayLineItem {
  code: string;
  name: string;
  amount: number;
  taxable?: boolean;
}

export interface AttendanceSnapshot {
  paidDays: number;
  presentDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  lateCount: number;
}

export interface PayslipProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  salaryStructureId?: string;
  payslipNumber: string;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  attendanceSnapshot: AttendanceSnapshot;
  earnings: PayLineItem[];
  deductions: PayLineItem[];
  reimbursements: PayLineItem[];
  grossPay: number;
  deductionTotal: number;
  reimbursementTotal: number;
  netPay: number;
  currency: string;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'on_hold';
  paidAt?: Date;
  paymentMode?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
  referenceNo?: string;
  status: PayslipStatus;
  approvedBy?: string;
  approvedAt?: Date;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Payslip extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeId?: string;
  private _salaryStructureId?: string;
  private _payslipNumber: string;
  private _month: number;
  private _year: number;
  private _periodStart: Date;
  private _periodEnd: Date;
  private _attendanceSnapshot: AttendanceSnapshot;
  private _earnings: PayLineItem[];
  private _deductions: PayLineItem[];
  private _reimbursements: PayLineItem[];
  private _grossPay: number;
  private _deductionTotal: number;
  private _reimbursementTotal: number;
  private _netPay: number;
  private _currency: string;
  private _paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'on_hold';
  private _paidAt?: Date;
  private _paymentMode?: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
  private _referenceNo?: string;
  private _status: PayslipStatus;
  private _approvedBy?: string;
  private _approvedAt?: Date;
  private _lockedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: PayslipProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeId = props.employeeId;
    this._salaryStructureId = props.salaryStructureId;
    this._payslipNumber = props.payslipNumber;
    this._month = props.month;
    this._year = props.year;
    this._periodStart = props.periodStart;
    this._periodEnd = props.periodEnd;
    this._attendanceSnapshot = props.attendanceSnapshot;
    this._earnings = props.earnings;
    this._deductions = props.deductions;
    this._reimbursements = props.reimbursements;
    this._grossPay = props.grossPay;
    this._deductionTotal = props.deductionTotal;
    this._reimbursementTotal = props.reimbursementTotal;
    this._netPay = props.netPay;
    this._currency = props.currency;
    this._paymentStatus = props.paymentStatus;
    this._paidAt = props.paidAt;
    this._paymentMode = props.paymentMode;
    this._referenceNo = props.referenceNo;
    this._status = props.status;
    this._approvedBy = props.approvedBy;
    this._approvedAt = props.approvedAt;
    this._lockedAt = props.lockedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeId?: string;
    salaryStructureId?: string;
    payslipNumber?: string;
    month: number;
    year: number;
    periodStart: Date;
    periodEnd: Date;
    attendanceSnapshot?: AttendanceSnapshot;
    earnings?: PayLineItem[];
    deductions?: PayLineItem[];
    reimbursements?: PayLineItem[];
    currency?: string;
  }): Payslip {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for payslip.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for payslip.');
    }
    if (params.month < 1 || params.month > 12) {
      throw new DomainError('Month must be between 1 and 12.');
    }

    const earnings = params.earnings ?? [];
    const deductions = params.deductions ?? [];
    const reimbursements = params.reimbursements ?? [];

    const grossPay = earnings.reduce((sum, e) => sum + e.amount, 0);
    const deductionTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
    const reimbursementTotal = reimbursements.reduce((sum, r) => sum + r.amount, 0);
    const netPay = Math.max(0, grossPay - deductionTotal + reimbursementTotal);

    const now = new Date();
    const pNumber =
      params.payslipNumber ||
      `PS-${params.year}${String(params.month).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new Payslip(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeId: params.employeeId,
      salaryStructureId: params.salaryStructureId,
      payslipNumber: pNumber,
      month: params.month,
      year: params.year,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      attendanceSnapshot: params.attendanceSnapshot ?? {
        paidDays: 30,
        presentDays: 30,
        leaveDays: 0,
        unpaidLeaveDays: 0,
        overtimeHours: 0,
        lateCount: 0,
      },
      earnings,
      deductions,
      reimbursements,
      grossPay,
      deductionTotal,
      reimbursementTotal,
      netPay,
      currency: params.currency ?? 'INR',
      paymentStatus: 'pending',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: PayslipProps): Payslip {
    return new Payslip(id, props);
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

  public get salaryStructureId(): string | undefined {
    return this._salaryStructureId;
  }

  public get payslipNumber(): string {
    return this._payslipNumber;
  }

  public get month(): number {
    return this._month;
  }

  public get year(): number {
    return this._year;
  }

  public get periodStart(): Date {
    return this._periodStart;
  }

  public get periodEnd(): Date {
    return this._periodEnd;
  }

  public get attendanceSnapshot(): Readonly<AttendanceSnapshot> {
    return this._attendanceSnapshot;
  }

  public get earnings(): ReadonlyArray<PayLineItem> {
    return this._earnings;
  }

  public get deductions(): ReadonlyArray<PayLineItem> {
    return this._deductions;
  }

  public get reimbursements(): ReadonlyArray<PayLineItem> {
    return this._reimbursements;
  }

  public get grossPay(): number {
    return this._grossPay;
  }

  public get deductionTotal(): number {
    return this._deductionTotal;
  }

  public get reimbursementTotal(): number {
    return this._reimbursementTotal;
  }

  public get netPay(): number {
    return this._netPay;
  }

  public get currency(): string {
    return this._currency;
  }

  public get paymentStatus(): string {
    return this._paymentStatus;
  }

  public get paymentMode(): string | undefined {
    return this._paymentMode;
  }

  public get referenceNo(): string | undefined {
    return this._referenceNo;
  }

  public get paidAt(): Date | undefined {
    return this._paidAt;
  }

  public get status(): PayslipStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public approve(approvedBy: string): void {
    this._status = 'approved';
    this._approvedBy = approvedBy;
    this._approvedAt = new Date();
    this._updatedAt = new Date();
  }

  public lock(): void {
    this._status = 'locked';
    this._lockedAt = new Date();
    this._updatedAt = new Date();
  }

  public markAsPaid(paymentMode: 'bank_transfer' | 'cash' | 'cheque' | 'upi', referenceNo?: string): void {
    this._status = 'paid';
    this._paymentStatus = 'paid';
    this._paymentMode = paymentMode;
    this._referenceNo = referenceNo;
    this._paidAt = new Date();
    this._updatedAt = new Date();
  }

  public updateStatus(status: PayslipStatus): void {
    this._status = status;
    this._updatedAt = new Date();
  }
}

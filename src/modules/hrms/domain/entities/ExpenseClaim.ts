import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { ExpenseCategory, ExpenseStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface ExpenseItem {
  id?: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate: Date;
  amount: number;
  taxAmount?: number;
  receiptUrl?: string;
}

export interface ExpenseApprovalStep {
  approver: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionAt?: Date;
}

export interface ExpenseClaimProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  claimNumber: string;
  title: string;
  currency: string;
  items: ExpenseItem[];
  totalAmount: number;
  approvedAmount: number;
  status: ExpenseStatus;
  approvalFlow: ExpenseApprovalStep[];
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reimbursedAt?: Date;
  payslipId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseClaim extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeId?: string;
  private _claimNumber: string;
  private _title: string;
  private _currency: string;
  private _items: ExpenseItem[];
  private _totalAmount: number;
  private _approvedAmount: number;
  private _status: ExpenseStatus;
  private _approvalFlow: ExpenseApprovalStep[];
  private _submittedAt?: Date;
  private _approvedBy?: string;
  private _approvedAt?: Date;
  private _reimbursedAt?: Date;
  private _payslipId?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ExpenseClaimProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeId = props.employeeId;
    this._claimNumber = props.claimNumber;
    this._title = props.title;
    this._currency = props.currency;
    this._items = props.items;
    this._totalAmount = props.totalAmount;
    this._approvedAmount = props.approvedAmount;
    this._status = props.status;
    this._approvalFlow = props.approvalFlow;
    this._submittedAt = props.submittedAt;
    this._approvedBy = props.approvedBy;
    this._approvedAt = props.approvedAt;
    this._reimbursedAt = props.reimbursedAt;
    this._payslipId = props.payslipId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeId?: string;
    title: string;
    currency?: string;
    items?: ExpenseItem[];
  }): ExpenseClaim {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for expense claim.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for expense claim.');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new DomainError('Title cannot be empty.');
    }

    const items = params.items ?? [];
    const totalAmount = items.reduce((sum, item) => sum + item.amount + (item.taxAmount ?? 0), 0);
    const now = new Date();
    const claimNumber = `EXP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new ExpenseClaim(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeId: params.employeeId,
      claimNumber,
      title: params.title.trim(),
      currency: params.currency ?? 'INR',
      items,
      totalAmount,
      approvedAmount: 0,
      status: 'draft',
      approvalFlow: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: ExpenseClaimProps): ExpenseClaim {
    return new ExpenseClaim(id, props);
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

  public get claimNumber(): string {
    return this._claimNumber;
  }

  public get title(): string {
    return this._title;
  }

  public get currency(): string {
    return this._currency;
  }

  public get items(): ReadonlyArray<ExpenseItem> {
    return this._items;
  }

  public get totalAmount(): number {
    return this._totalAmount;
  }

  public get approvedAmount(): number {
    return this._approvedAmount;
  }

  public get status(): ExpenseStatus {
    return this._status;
  }

  public get approvalFlow(): ReadonlyArray<ExpenseApprovalStep> {
    return this._approvalFlow;
  }

  public get submittedAt(): Date | undefined {
    return this._submittedAt;
  }

  public get approvedBy(): string | undefined {
    return this._approvedBy;
  }

  public get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  public get reimbursedAt(): Date | undefined {
    return this._reimbursedAt;
  }

  public get payslipId(): string | undefined {
    return this._payslipId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    title?: string;
    items?: ExpenseItem[];
  }): void {
    if (this._status !== 'draft') {
      throw new DomainError(`Cannot update expense claim in status '${this._status}'.`);
    }
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new DomainError('Title cannot be empty.');
      this._title = params.title.trim();
    }
    if (params.items !== undefined) {
      this._items = [...params.items];
      this._totalAmount = this._items.reduce((sum, item) => sum + item.amount + (item.taxAmount ?? 0), 0);
    }
    this._updatedAt = new Date();
  }

  public submit(): void {
    if (this._status !== 'draft') {
      throw new DomainError(`Cannot submit expense claim in status '${this._status}'.`);
    }
    this._status = 'submitted';
    this._submittedAt = new Date();
    this._updatedAt = new Date();
  }

  public approve(approverId: string, approvedAmount?: number, comments?: string): void {
    const amount = approvedAmount !== undefined ? approvedAmount : this._totalAmount;
    if (amount > this._totalAmount) {
      throw new DomainError('Approved amount cannot exceed total amount.');
    }
    this._status = amount < this._totalAmount ? 'partially_approved' : 'approved';
    this._approvedAmount = amount;
    this._approvedBy = approverId;
    this._approvedAt = new Date();
    this._approvalFlow.push({
      approver: approverId,
      level: this._approvalFlow.length + 1,
      status: 'approved',
      comments,
      actionAt: new Date(),
    });
    this._updatedAt = new Date();
  }

  public reject(approverId: string, comments?: string): void {
    this._status = 'rejected';
    this._approvalFlow.push({
      approver: approverId,
      level: this._approvalFlow.length + 1,
      status: 'rejected',
      comments,
      actionAt: new Date(),
    });
    this._updatedAt = new Date();
  }

  public reimburse(): void {
    if (this._status !== 'approved' && this._status !== 'partially_approved') {
      throw new DomainError('Only approved expense claims can be reimbursed.');
    }
    this._status = 'reimbursed';
    this._reimbursedAt = new Date();
    this._updatedAt = new Date();
  }
}

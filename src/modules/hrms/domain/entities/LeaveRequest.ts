import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { LeaveType, LeaveRequestStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface LeaveApprovalStep {
  approver: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionAt?: Date;
}

export interface LeaveRequestProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeRef?: string;
  departmentId?: string;
  assignedApprover: string;
  leaveRequestId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  startSession: 'full' | 'first_half' | 'second_half';
  endSession: 'full' | 'first_half' | 'second_half';
  reason: string;
  status: LeaveRequestStatus;
  approvalFlow: LeaveApprovalStep[];
  escalatedTo?: string;
  escalatedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaveRequest extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeRef?: string;
  private _departmentId?: string;
  private _assignedApprover: string;
  private _leaveRequestId: string;
  private _leaveType: LeaveType;
  private _startDate: Date;
  private _endDate: Date;
  private _daysCount: number;
  private _startSession: 'full' | 'first_half' | 'second_half';
  private _endSession: 'full' | 'first_half' | 'second_half';
  private _reason: string;
  private _status: LeaveRequestStatus;
  private _approvalFlow: LeaveApprovalStep[];
  private _escalatedTo?: string;
  private _escalatedReason?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: LeaveRequestProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeRef = props.employeeRef;
    this._departmentId = props.departmentId;
    this._assignedApprover = props.assignedApprover;
    this._leaveRequestId = props.leaveRequestId;
    this._leaveType = props.leaveType;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._daysCount = props.daysCount;
    this._startSession = props.startSession;
    this._endSession = props.endSession;
    this._reason = props.reason;
    this._status = props.status;
    this._approvalFlow = props.approvalFlow;
    this._escalatedTo = props.escalatedTo;
    this._escalatedReason = props.escalatedReason;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeRef?: string;
    departmentId?: string;
    assignedApprover: string;
    leaveRequestId?: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    daysCount: number;
    startSession?: 'full' | 'first_half' | 'second_half';
    endSession?: 'full' | 'first_half' | 'second_half';
    reason: string;
  }): LeaveRequest {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for leave request.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for leave request.');
    }
    if (!params.assignedApprover) {
      throw new DomainError('Approver is required for leave request.');
    }
    if (!params.startDate || !params.endDate) {
      throw new DomainError('Start and end date are required for leave request.');
    }
    if (params.daysCount <= 0) {
      throw new DomainError('Days count must be positive.');
    }
    if (!params.reason || params.reason.trim().length === 0) {
      throw new DomainError('Reason cannot be empty.');
    }

    const now = new Date();
    const lId = params.leaveRequestId || `LR-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new LeaveRequest(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeRef: params.employeeRef,
      departmentId: params.departmentId,
      assignedApprover: params.assignedApprover,
      leaveRequestId: lId,
      leaveType: params.leaveType,
      startDate: params.startDate,
      endDate: params.endDate,
      daysCount: params.daysCount,
      startSession: params.startSession ?? 'full',
      endSession: params.endSession ?? 'full',
      reason: params.reason.trim(),
      status: 'pending',
      approvalFlow: [
        {
          approver: params.assignedApprover,
          level: 1,
          status: 'pending',
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: LeaveRequestProps): LeaveRequest {
    return new LeaveRequest(id, props);
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

  public get employeeRef(): string | undefined {
    return this._employeeRef;
  }

  public get departmentId(): string | undefined {
    return this._departmentId;
  }

  public get assignedApprover(): string {
    return this._assignedApprover;
  }

  public get leaveRequestId(): string {
    return this._leaveRequestId;
  }

  public get leaveType(): LeaveType {
    return this._leaveType;
  }

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public get daysCount(): number {
    return this._daysCount;
  }

  public get startSession(): 'full' | 'first_half' | 'second_half' {
    return this._startSession;
  }

  public get endSession(): 'full' | 'first_half' | 'second_half' {
    return this._endSession;
  }

  public get reason(): string {
    return this._reason;
  }

  public get status(): LeaveRequestStatus {
    return this._status;
  }

  public get approvalFlow(): ReadonlyArray<LeaveApprovalStep> {
    return this._approvalFlow;
  }

  public get escalatedTo(): string | undefined {
    return this._escalatedTo;
  }

  public get escalatedReason(): string | undefined {
    return this._escalatedReason;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    startDate?: Date;
    endDate?: Date;
    daysCount?: number;
    reason?: string;
  }): void {
    if (this._status !== 'pending' && this._status !== 'draft') {
      throw new DomainError(`Cannot update leave request in status '${this._status}'.`);
    }
    if (params.startDate) this._startDate = params.startDate;
    if (params.endDate) this._endDate = params.endDate;
    if (params.daysCount) this._daysCount = params.daysCount;
    if (params.reason) this._reason = params.reason.trim();
    this._updatedAt = new Date();
  }

  public approve(approverId: string, comments?: string): void {
    if (this._status !== 'pending' && this._status !== 'escalated') {
      throw new DomainError(`Cannot approve leave request in status '${this._status}'.`);
    }
    this._status = 'approved';
    const now = new Date();
    const flowItem = this._approvalFlow.find((f) => f.approver === approverId);
    if (flowItem) {
      flowItem.status = 'approved';
      flowItem.comments = comments;
      flowItem.actionAt = now;
    } else {
      this._approvalFlow.push({
        approver: approverId,
        level: this._approvalFlow.length + 1,
        status: 'approved',
        comments,
        actionAt: now,
      });
    }
    this._updatedAt = now;
  }

  public reject(approverId: string, comments?: string): void {
    if (this._status !== 'pending' && this._status !== 'escalated') {
      throw new DomainError(`Cannot reject leave request in status '${this._status}'.`);
    }
    this._status = 'rejected';
    const now = new Date();
    const flowItem = this._approvalFlow.find((f) => f.approver === approverId);
    if (flowItem) {
      flowItem.status = 'rejected';
      flowItem.comments = comments;
      flowItem.actionAt = now;
    } else {
      this._approvalFlow.push({
        approver: approverId,
        level: this._approvalFlow.length + 1,
        status: 'rejected',
        comments,
        actionAt: now,
      });
    }
    this._updatedAt = now;
  }

  public escalate(escalatedTo: string, reason: string): void {
    if (this._status !== 'pending') {
      throw new DomainError(`Cannot escalate leave request with status '${this._status}'.`);
    }
    this._status = 'escalated';
    this._escalatedTo = escalatedTo;
    this._escalatedReason = reason;
    this._updatedAt = new Date();
  }

  public cancel(): void {
    if (this._status === 'cancelled') return;
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }
}

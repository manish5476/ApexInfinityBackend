import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export type AttendanceRequestType = 'regularization' | 'correction' | 'on_duty' | 'work_from_home' | 'overtime';
export type AttendanceRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AttendanceRequestProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  type: AttendanceRequestType;
  date: Date;
  requestedFirstIn?: Date;
  requestedLastOut?: Date;
  reason: string;
  status: AttendanceRequestStatus;
  assignedApprover: string;
  actionBy?: string;
  actionAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceRequest extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeId?: string;
  private _type: AttendanceRequestType;
  private _date: Date;
  private _requestedFirstIn?: Date;
  private _requestedLastOut?: Date;
  private _reason: string;
  private _status: AttendanceRequestStatus;
  private _assignedApprover: string;
  private _actionBy?: string;
  private _actionAt?: Date;
  private _rejectionReason?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: AttendanceRequestProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeId = props.employeeId;
    this._type = props.type;
    this._date = props.date;
    this._requestedFirstIn = props.requestedFirstIn;
    this._requestedLastOut = props.requestedLastOut;
    this._reason = props.reason;
    this._status = props.status;
    this._assignedApprover = props.assignedApprover;
    this._actionBy = props.actionBy;
    this._actionAt = props.actionAt;
    this._rejectionReason = props.rejectionReason;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeId?: string;
    type: AttendanceRequestType;
    date: Date;
    requestedFirstIn?: Date;
    requestedLastOut?: Date;
    reason: string;
    assignedApprover: string;
  }): AttendanceRequest {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for attendance request.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for attendance request.');
    }
    if (!params.reason || params.reason.trim().length === 0) {
      throw new DomainError('Reason is required for attendance request.');
    }
    if (!params.assignedApprover) {
      throw new DomainError('Approver is required for attendance request.');
    }

    const now = new Date();
    return new AttendanceRequest(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeId: params.employeeId,
      type: params.type,
      date: params.date,
      requestedFirstIn: params.requestedFirstIn,
      requestedLastOut: params.requestedLastOut,
      reason: params.reason.trim(),
      status: 'pending',
      assignedApprover: params.assignedApprover,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: AttendanceRequestProps): AttendanceRequest {
    return new AttendanceRequest(id, props);
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

  public get type(): AttendanceRequestType {
    return this._type;
  }

  public get date(): Date {
    return this._date;
  }

  public get requestedFirstIn(): Date | undefined {
    return this._requestedFirstIn;
  }

  public get requestedLastOut(): Date | undefined {
    return this._requestedLastOut;
  }

  public get reason(): string {
    return this._reason;
  }

  public get status(): AttendanceRequestStatus {
    return this._status;
  }

  public get assignedApprover(): string {
    return this._assignedApprover;
  }

  public get actionBy(): string | undefined {
    return this._actionBy;
  }

  public get actionAt(): Date | undefined {
    return this._actionAt;
  }

  public get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public approve(actionBy: string): void {
    if (this._status !== 'pending') {
      throw new DomainError(`Cannot approve request with status '${this._status}'.`);
    }
    this._status = 'approved';
    this._actionBy = actionBy;
    this._actionAt = new Date();
    this._updatedAt = new Date();
  }

  public reject(actionBy: string, reason?: string): void {
    if (this._status !== 'pending') {
      throw new DomainError(`Cannot reject request with status '${this._status}'.`);
    }
    this._status = 'rejected';
    this._actionBy = actionBy;
    this._actionAt = new Date();
    this._rejectionReason = reason;
    this._updatedAt = new Date();
  }

  public cancel(): void {
    if (this._status !== 'pending') {
      throw new DomainError(`Cannot cancel request with status '${this._status}'.`);
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }
}

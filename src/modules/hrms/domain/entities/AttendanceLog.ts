import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export interface AttendanceLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  geofenceStatus?: 'inside' | 'outside' | 'disabled';
  geofenceId?: string;
}

export interface AttendanceLogProps {
  organizationId: string;
  branchId?: string;
  userId: string;
  employeeId?: string;
  machineId?: string;
  source: 'machine' | 'web' | 'mobile' | 'admin_manual' | 'api' | 'biometric' | 'rfid';
  type: 'in' | 'out' | 'break_start' | 'break_end' | 'remote_in' | 'remote_out' | 'overtime_in' | 'overtime_out';
  timestamp: Date;
  serverTimestamp: Date;
  ipAddress?: string;
  deviceId?: string;
  location?: AttendanceLocation;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  isFlagged: boolean;
  flagReason?: string;
  flaggedBy?: string;
  isCorrected: boolean;
  correctionNotes?: string;
  correctedBy?: string;
  processingStatus: 'pending' | 'processed' | 'flagged' | 'rejected' | 'corrected' | 'duplicate';
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceLog extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId: string;
  private _employeeId?: string;
  private _machineId?: string;
  private _source: 'machine' | 'web' | 'mobile' | 'admin_manual' | 'api' | 'biometric' | 'rfid';
  private _type: 'in' | 'out' | 'break_start' | 'break_end' | 'remote_in' | 'remote_out' | 'overtime_in' | 'overtime_out';
  private _timestamp: Date;
  private _serverTimestamp: Date;
  private _ipAddress?: string;
  private _deviceId?: string;
  private _location?: AttendanceLocation;
  private _isVerified: boolean;
  private _verifiedBy?: string;
  private _verifiedAt?: Date;
  private _isFlagged: boolean;
  private _flagReason?: string;
  private _flaggedBy?: string;
  private _isCorrected: boolean;
  private _correctionNotes?: string;
  private _correctedBy?: string;
  private _processingStatus: 'pending' | 'processed' | 'flagged' | 'rejected' | 'corrected' | 'duplicate';
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: AttendanceLogProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeId = props.employeeId;
    this._machineId = props.machineId;
    this._source = props.source;
    this._type = props.type;
    this._timestamp = props.timestamp;
    this._serverTimestamp = props.serverTimestamp;
    this._ipAddress = props.ipAddress;
    this._deviceId = props.deviceId;
    this._location = props.location;
    this._isVerified = props.isVerified;
    this._verifiedBy = props.verifiedBy;
    this._verifiedAt = props.verifiedAt;
    this._isFlagged = props.isFlagged;
    this._flagReason = props.flagReason;
    this._flaggedBy = props.flaggedBy;
    this._isCorrected = props.isCorrected;
    this._correctionNotes = props.correctionNotes;
    this._correctedBy = props.correctedBy;
    this._processingStatus = props.processingStatus;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId: string;
    employeeId?: string;
    machineId?: string;
    source: 'machine' | 'web' | 'mobile' | 'admin_manual' | 'api' | 'biometric' | 'rfid';
    type: 'in' | 'out' | 'break_start' | 'break_end' | 'remote_in' | 'remote_out' | 'overtime_in' | 'overtime_out';
    timestamp?: Date;
    ipAddress?: string;
    deviceId?: string;
    location?: AttendanceLocation;
  }): AttendanceLog {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for attendance log.');
    }
    if (!params.userId) {
      throw new DomainError('User ID is required for attendance log.');
    }

    const now = new Date();
    return new AttendanceLog(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeId: params.employeeId,
      machineId: params.machineId,
      source: params.source,
      type: params.type,
      timestamp: params.timestamp ?? now,
      serverTimestamp: now,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      location: params.location,
      isVerified: false,
      isFlagged: false,
      isCorrected: false,
      processingStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: AttendanceLogProps): AttendanceLog {
    return new AttendanceLog(id, props);
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

  public get machineId(): string | undefined {
    return this._machineId;
  }

  public get source(): string {
    return this._source;
  }

  public get type(): string {
    return this._type;
  }

  public get timestamp(): Date {
    return this._timestamp;
  }

  public get serverTimestamp(): Date {
    return this._serverTimestamp;
  }

  public get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  public get deviceId(): string | undefined {
    return this._deviceId;
  }

  public get location(): AttendanceLocation | undefined {
    return this._location;
  }

  public get isVerified(): boolean {
    return this._isVerified;
  }

  public get verifiedBy(): string | undefined {
    return this._verifiedBy;
  }

  public get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  public get isFlagged(): boolean {
    return this._isFlagged;
  }

  public get flagReason(): string | undefined {
    return this._flagReason;
  }

  public get flaggedBy(): string | undefined {
    return this._flaggedBy;
  }

  public get isCorrected(): boolean {
    return this._isCorrected;
  }

  public get correctionNotes(): string | undefined {
    return this._correctionNotes;
  }

  public get correctedBy(): string | undefined {
    return this._correctedBy;
  }

  public get processingStatus(): string {
    return this._processingStatus;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public verify(verifiedBy: string): void {
    this._isVerified = true;
    this._verifiedBy = verifiedBy;
    this._verifiedAt = new Date();
    this._processingStatus = 'processed';
    this._updatedAt = new Date();
  }

  public flag(reason: string, flaggedBy: string): void {
    this._isFlagged = true;
    this._flagReason = reason;
    this._flaggedBy = flaggedBy;
    this._processingStatus = 'flagged';
    this._updatedAt = new Date();
  }

  public correct(notes: string, correctedBy: string, updatedTimestamp?: Date, updatedType?: 'in' | 'out'): void {
    this._isCorrected = true;
    this._correctionNotes = notes;
    this._correctedBy = correctedBy;
    if (updatedTimestamp) this._timestamp = updatedTimestamp;
    if (updatedType) this._type = updatedType;
    this._processingStatus = 'corrected';
    this._updatedAt = new Date();
  }
}

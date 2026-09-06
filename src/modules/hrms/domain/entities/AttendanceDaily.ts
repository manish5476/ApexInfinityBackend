import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { AttendanceStatus } from '../value-objects/HrmsEnums';
import { Shift } from './Shift';
import { v4 as uuidv4 } from 'uuid';

export interface PunchRecord {
  type: 'in' | 'out';
  timestamp: Date;
  deviceId?: string;
  source?: string;
}

export interface AttendanceDailyProps {
  organizationId: string;
  employeeId: string;
  date: Date;
  shiftId?: string;
  firstIn?: Date;
  lastOut?: Date;
  totalWorkHours: number;
  isLate: boolean;
  lateMinutes: number;
  status: AttendanceStatus;
  punches: PunchRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceDaily extends Entity<string> {
  private _organizationId: string;
  private _employeeId: string;
  private _date: Date;
  private _shiftId?: string;
  private _firstIn?: Date;
  private _lastOut?: Date;
  private _totalWorkHours: number;
  private _isLate: boolean;
  private _lateMinutes: number;
  private _status: AttendanceStatus;
  private _punches: PunchRecord[];
  private _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: AttendanceDailyProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._employeeId = props.employeeId;
    this._date = props.date;
    this._shiftId = props.shiftId;
    this._firstIn = props.firstIn;
    this._lastOut = props.lastOut;
    this._totalWorkHours = props.totalWorkHours;
    this._isLate = props.isLate;
    this._lateMinutes = props.lateMinutes;
    this._status = props.status;
    this._punches = props.punches;
    this._notes = props.notes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    employeeId: string;
    date: Date;
    shiftId?: string;
    initialStatus?: AttendanceStatus;
  }): AttendanceDaily {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for daily attendance.');
    }
    if (!params.employeeId) {
      throw new DomainError('Employee ID is required for daily attendance.');
    }

    const dayStart = new Date(params.date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    return new AttendanceDaily(uuidv4(), {
      organizationId: params.organizationId,
      employeeId: params.employeeId,
      date: dayStart,
      shiftId: params.shiftId,
      firstIn: undefined,
      lastOut: undefined,
      totalWorkHours: 0,
      isLate: false,
      lateMinutes: 0,
      status: params.initialStatus ?? 'absent',
      punches: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: AttendanceDailyProps): AttendanceDaily {
    return new AttendanceDaily(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get employeeId(): string {
    return this._employeeId;
  }

  public get date(): Date {
    return this._date;
  }

  public get shiftId(): string | undefined {
    return this._shiftId;
  }

  public get firstIn(): Date | undefined {
    return this._firstIn;
  }

  public get lastOut(): Date | undefined {
    return this._lastOut;
  }

  public get totalWorkHours(): number {
    return this._totalWorkHours;
  }

  public get isLate(): boolean {
    return this._isLate;
  }

  public get lateMinutes(): number {
    return this._lateMinutes;
  }

  public get status(): AttendanceStatus {
    return this._status;
  }

  public get punches(): ReadonlyArray<PunchRecord> {
    return this._punches;
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

  /**
   * Records a punch and automatically recalculates hours and updates status.
   * FIXES P0 DEFECT: No longer remains perpetually 'absent'.
   */
  public recordPunch(params: {
    type: 'in' | 'out';
    timestamp: Date;
    shift?: Shift;
    deviceId?: string;
    source?: string;
  }): void {
    const { type, timestamp, shift, deviceId, source } = params;

    this._punches.push({
      type,
      timestamp,
      deviceId,
      source,
    });

    if (type === 'in') {
      if (!this._firstIn || timestamp < this._firstIn) {
        this._firstIn = timestamp;

        if (shift) {
          const evalResult = shift.evaluateArrival(this._firstIn, this._date);
          this._isLate = evalResult.isLate;
          this._lateMinutes = evalResult.lateMinutes;
        }
      }
    } else if (type === 'out') {
      if (!this._lastOut || timestamp > this._lastOut) {
        this._lastOut = timestamp;
      }
    }

    // Reconcile working hours & status
    if (this._firstIn && this._lastOut) {
      if (shift) {
        this._totalWorkHours = shift.calculateNetWorkHours(this._firstIn, this._lastOut);
        this._status = shift.determineStatus(this._totalWorkHours, this._isLate);
      } else {
        const rawMs = Math.max(0, this._lastOut.getTime() - this._firstIn.getTime());
        this._totalWorkHours = Math.round((rawMs / (1000 * 60 * 60)) * 100) / 100;
        this._status = this._totalWorkHours >= 4 ? 'present' : 'half_day';
      }
    } else if (this._firstIn && !this._lastOut) {
      // Clocked in but hasn't clocked out yet: mark as present (or late) for today's active work
      this._status = this._isLate ? 'late' : 'present';
    }

    this._updatedAt = new Date();
  }

  public markAsLeave(): void {
    this._status = 'on_leave';
    this._updatedAt = new Date();
  }

  public markAsHoliday(): void {
    this._status = 'holiday';
    this._updatedAt = new Date();
  }

  public markAsWeeklyOff(): void {
    this._status = 'weekly_off';
    this._updatedAt = new Date();
  }
}

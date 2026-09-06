import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { AttendanceStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface ShiftProps {
  organizationId: string;
  name: string;
  code: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  gracePeriodMins: number;
  halfDayThresholdHours: number;
  minFullDayHours: number;
  unpaidBreakMins: number;
  weeklyOffs: number[]; // 0=Sunday, 6=Saturday
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Shift extends Entity<string> {
  private _organizationId: string;
  private _name: string;
  private _code: string;
  private _startTime: string;
  private _endTime: string;
  private _gracePeriodMins: number;
  private _halfDayThresholdHours: number;
  private _minFullDayHours: number;
  private _unpaidBreakMins: number;
  private _weeklyOffs: number[];
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ShiftProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._code = props.code;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._gracePeriodMins = props.gracePeriodMins;
    this._halfDayThresholdHours = props.halfDayThresholdHours;
    this._minFullDayHours = props.minFullDayHours;
    this._unpaidBreakMins = props.unpaidBreakMins;
    this._weeklyOffs = props.weeklyOffs;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    gracePeriodMins?: number;
    halfDayThresholdHours?: number;
    minFullDayHours?: number;
    unpaidBreakMins?: number;
    weeklyOffs?: number[];
  }): Shift {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for shift.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Shift name cannot be empty.');
    }
    if (!params.code || params.code.trim().length === 0) {
      throw new DomainError('Shift code cannot be empty.');
    }
    if (!/^\d{2}:\d{2}$/.test(params.startTime) || !/^\d{2}:\d{2}$/.test(params.endTime)) {
      throw new DomainError('Shift times must be in HH:mm 24-hour format.');
    }

    const now = new Date();
    return new Shift(uuidv4(), {
      organizationId: params.organizationId,
      name: params.name.trim(),
      code: params.code.trim().toUpperCase(),
      startTime: params.startTime,
      endTime: params.endTime,
      gracePeriodMins: params.gracePeriodMins ?? 15,
      halfDayThresholdHours: params.halfDayThresholdHours ?? 4.5,
      minFullDayHours: params.minFullDayHours ?? 8.0,
      unpaidBreakMins: params.unpaidBreakMins ?? 60,
      weeklyOffs: params.weeklyOffs ?? [0, 6], // default Sun & Sat
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: ShiftProps): Shift {
    return new Shift(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get name(): string {
    return this._name;
  }

  public get code(): string {
    return this._code;
  }

  public get startTime(): string {
    return this._startTime;
  }

  public get endTime(): string {
    return this._endTime;
  }

  public get gracePeriodMins(): number {
    return this._gracePeriodMins;
  }

  public get halfDayThresholdHours(): number {
    return this._halfDayThresholdHours;
  }

  public get minFullDayHours(): number {
    return this._minFullDayHours;
  }

  public get unpaidBreakMins(): number {
    return this._unpaidBreakMins;
  }

  public get weeklyOffs(): ReadonlyArray<number> {
    return this._weeklyOffs;
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

  /**
   * Evaluates arrival timestamp against shift scheduled start time.
   */
  public evaluateArrival(firstIn: Date, shiftDate: Date): { isLate: boolean; lateMinutes: number } {
    const [hoursStr, minsStr] = this._startTime.split(':');
    const scheduledStart = new Date(shiftDate);
    scheduledStart.setUTCHours(parseInt(hoursStr!, 10), parseInt(minsStr!, 10), 0, 0);

    const graceLimit = new Date(scheduledStart.getTime() + this._gracePeriodMins * 60 * 1000);

    if (firstIn.getTime() > graceLimit.getTime()) {
      const lateMs = firstIn.getTime() - scheduledStart.getTime();
      const lateMinutes = Math.round(lateMs / (1000 * 60));
      return { isLate: true, lateMinutes };
    }

    return { isLate: false, lateMinutes: 0 };
  }

  /**
   * Calculates net working hours deducting unpaid break.
   */
  public calculateNetWorkHours(firstIn?: Date, lastOut?: Date): number {
    if (!firstIn || !lastOut) return 0;
    const grossMs = lastOut.getTime() - firstIn.getTime();
    if (grossMs <= 0) return 0;

    const grossHours = grossMs / (1000 * 60 * 60);
    const breakHours = this._unpaidBreakMins / 60;

    // Deduct break only if employee worked more than 4 hours
    const netHours = grossHours > 4 ? Math.max(0, grossHours - breakHours) : grossHours;
    return Math.round(netHours * 100) / 100;
  }

  /**
   * Reconciles working hours and tardiness to determine the accurate attendance status.
   */
  public determineStatus(netHours: number, isLate: boolean): AttendanceStatus {
    if (netHours >= this._minFullDayHours) {
      return isLate ? 'late' : 'present';
    }
    if (netHours >= this._halfDayThresholdHours) {
      return 'half_day';
    }
    if (netHours > 0) {
      return 'half_day';
    }
    return 'absent';
  }
}

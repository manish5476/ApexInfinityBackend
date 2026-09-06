import { IDomainEvent } from '../../../../core/domain/IDomainEvent';
import { AttendanceStatus } from '../value-objects/HrmsEnums';

export interface DailyAttendanceRolledUpPayload {
  attendanceId: string;
  organizationId: string;
  employeeId: string;
  date: Date;
  status: AttendanceStatus;
  totalWorkHours: number;
}

export class DailyAttendanceRolledUpEvent implements IDomainEvent<DailyAttendanceRolledUpPayload> {
  public readonly eventName = 'hrms.attendance.rolled_up';
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly payload: DailyAttendanceRolledUpPayload;

  constructor(params: DailyAttendanceRolledUpPayload) {
    this.occurredOn = new Date();
    this.aggregateId = params.attendanceId;
    this.payload = { ...params };
    Object.freeze(this);
  }
}

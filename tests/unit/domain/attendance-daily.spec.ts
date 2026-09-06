import { AttendanceDaily } from '../../../src/modules/hrms/domain/entities/AttendanceDaily';
import { Shift } from '../../../src/modules/hrms/domain/entities/Shift';

describe('AttendanceDaily Domain Entity (Pure Unit Test - 0 Dependencies)', () => {
  let shift: Shift;

  beforeEach(() => {
    shift = Shift.create({
      organizationId: 'org-123',
      name: 'Standard Shift',
      code: 'STD-01',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMins: 15,
      halfDayThresholdHours: 4.5,
      minFullDayHours: 8.0,
      unpaidBreakMins: 60,
    });
  });

  it('should initialize with status absent', () => {
    const daily = AttendanceDaily.create({
      organizationId: 'org-123',
      employeeId: 'emp-001',
      date: new Date('2026-10-15'),
      shiftId: shift.id,
    });

    expect(daily.status).toBe('absent');
    expect(daily.totalWorkHours).toBe(0);
    expect(daily.firstIn).toBeUndefined();
    expect(daily.lastOut).toBeUndefined();
  });

  it('should update status to present on clock in (FIXES P0 PERPETUAL ABSENT DEFECT)', () => {
    const daily = AttendanceDaily.create({
      organizationId: 'org-123',
      employeeId: 'emp-001',
      date: new Date('2026-10-15T00:00:00.000Z'),
      shiftId: shift.id,
    });

    const clockInTime = new Date('2026-10-15T09:05:00.000Z');
    daily.recordPunch({
      type: 'in',
      timestamp: clockInTime,
      shift,
    });

    expect(daily.firstIn).toEqual(clockInTime);
    expect(daily.isLate).toBe(false);
    expect(daily.status).toBe('present'); // NOT absent!
  });

  it('should update status to late on tardy clock in', () => {
    const daily = AttendanceDaily.create({
      organizationId: 'org-123',
      employeeId: 'emp-001',
      date: new Date('2026-10-15T00:00:00.000Z'),
      shiftId: shift.id,
    });

    const lateClockInTime = new Date('2026-10-15T09:45:00.000Z'); // 45 mins into shift
    daily.recordPunch({
      type: 'in',
      timestamp: lateClockInTime,
      shift,
    });

    expect(daily.isLate).toBe(true);
    expect(daily.lateMinutes).toBe(45);
    expect(daily.status).toBe('late');
  });

  it('should calculate full day hours and finalize status on clock out', () => {
    const daily = AttendanceDaily.create({
      organizationId: 'org-123',
      employeeId: 'emp-001',
      date: new Date('2026-10-15T00:00:00.000Z'),
      shiftId: shift.id,
    });

    daily.recordPunch({
      type: 'in',
      timestamp: new Date('2026-10-15T09:00:00.000Z'),
      shift,
    });

    daily.recordPunch({
      type: 'out',
      timestamp: new Date('2026-10-15T18:00:00.000Z'),
      shift,
    });

    expect(daily.totalWorkHours).toBe(8); // 9 gross - 1 break
    expect(daily.status).toBe('present');
    expect(daily.punches.length).toBe(2);
  });
});

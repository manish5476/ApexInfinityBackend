import { Shift } from '../../../src/modules/hrms/domain/entities/Shift';

describe('Shift Domain Entity (Pure Unit Test - 0 Dependencies)', () => {
  let shift: Shift;

  beforeEach(() => {
    shift = Shift.create({
      organizationId: 'org-123',
      name: 'General Morning Shift',
      code: 'GEN-01',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMins: 15,
      halfDayThresholdHours: 4.5,
      minFullDayHours: 8.0,
      unpaidBreakMins: 60,
    });
  });

  it('should mark arrival within grace period as not late', () => {
    const shiftDate = new Date('2026-10-15T00:00:00.000Z');
    const clockIn = new Date('2026-10-15T09:10:00.000Z'); // 10 mins into shift, within 15 min grace

    const arrival = shift.evaluateArrival(clockIn, shiftDate);
    expect(arrival.isLate).toBe(false);
    expect(arrival.lateMinutes).toBe(0);
  });

  it('should mark arrival after grace period as late with correct late minutes', () => {
    const shiftDate = new Date('2026-10-15T00:00:00.000Z');
    const clockIn = new Date('2026-10-15T09:35:00.000Z'); // 35 mins late

    const arrival = shift.evaluateArrival(clockIn, shiftDate);
    expect(arrival.isLate).toBe(true);
    expect(arrival.lateMinutes).toBe(35);
  });

  it('should deduct unpaid break when working full day (> 4 hours)', () => {
    const firstIn = new Date('2026-10-15T09:00:00.000Z');
    const lastOut = new Date('2026-10-15T18:00:00.000Z'); // 9 hours gross

    const netHours = shift.calculateNetWorkHours(firstIn, lastOut);
    // 9 gross hours - 1 hour unpaid break = 8.0 net hours
    expect(netHours).toBe(8);
  });

  it('should determine status as present for full hours without tardiness', () => {
    const status = shift.determineStatus(8.0, false);
    expect(status).toBe('present');
  });

  it('should determine status as late for full hours with tardiness', () => {
    const status = shift.determineStatus(8.0, true);
    expect(status).toBe('late');
  });

  it('should determine status as half_day when hours exceed halfDayThreshold but below fullDay', () => {
    const status = shift.determineStatus(5.0, false);
    expect(status).toBe('half_day');
  });

  it('should determine status as absent when work hours are 0', () => {
    const status = shift.determineStatus(0, false);
    expect(status).toBe('absent');
  });
});

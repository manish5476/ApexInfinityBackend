import { ProcessAttendancePunchUseCase } from '../../../src/modules/hrms/application/use-cases/ProcessAttendancePunchUseCase';
import { InMemoryEmployeeRepository } from '../../../src/modules/hrms/infrastructure/repositories/InMemoryEmployeeRepository';
import { InMemoryShiftRepository } from '../../../src/modules/hrms/infrastructure/repositories/InMemoryShiftRepository';
import { InMemoryAttendanceDailyRepository } from '../../../src/modules/hrms/infrastructure/repositories/InMemoryAttendanceDailyRepository';
import { AttendanceMapper } from '../../../src/modules/hrms/application/mappers/AttendanceMapper';
import { Employee } from '../../../src/modules/hrms/domain/entities/Employee';
import { Shift } from '../../../src/modules/hrms/domain/entities/Shift';
import { IEventBus } from '../../../src/infrastructure/messaging/IEventBus';

describe('ProcessAttendancePunchUseCase (FIXES P0 PERPETUAL ABSENT STATUS)', () => {
  let employeeRepo: InMemoryEmployeeRepository;
  let shiftRepo: InMemoryShiftRepository;
  let attendanceRepo: InMemoryAttendanceDailyRepository;
  let mapper: AttendanceMapper;
  let mockEventBus: IEventBus;
  let useCase: ProcessAttendancePunchUseCase;

  let seededEmployee: Employee;
  let seededShift: Shift;
  const orgId = 'org-tenant-1';

  beforeEach(async () => {
    employeeRepo = new InMemoryEmployeeRepository();
    shiftRepo = new InMemoryShiftRepository();
    attendanceRepo = new InMemoryAttendanceDailyRepository();
    mapper = new AttendanceMapper();

    mockEventBus = {
      publish: jest.fn(),
      publishDomainEvent: jest.fn(),
      subscribe: jest.fn(),
    };

    // 1. Seed a 09:00 - 18:00 shift with 15 min grace
    seededShift = Shift.create({
      organizationId: orgId,
      name: 'Standard Morning Shift',
      code: 'STD-01',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMins: 15,
      halfDayThresholdHours: 4.5,
      minFullDayHours: 8.0,
      unpaidBreakMins: 60,
    });
    await shiftRepo.save(seededShift);

    // 2. Seed an employee assigned to this shift
    seededEmployee = Employee.create({
      organizationId: orgId,
      employeeCode: 'EMP-201',
      firstName: 'Tony',
      lastName: 'Stark',
      email: 'tony.stark@apexinfinity.com',
      shiftId: seededShift.id,
    });
    await employeeRepo.save(seededEmployee);

    useCase = new ProcessAttendancePunchUseCase(
      employeeRepo,
      shiftRepo,
      attendanceRepo,
      mapper,
      mockEventBus
    );
  });

  it('P0 FIX: clocking in on time must update status to "present", NOT remain "absent"', async () => {
    const clockInTime = '2026-10-15T09:05:00.000Z'; // 5 mins in, on time

    const result = await useCase.execute(
      {
        employeeId: seededEmployee.id,
        type: 'in',
        timestamp: clockInTime,
      },
      {
        organizationId: orgId,
        requestId: 'req-1',
        correlationId: 'corr-1',
        roles: ['employee'],
        permissions: [],
      }
    );

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.status).toBe('present'); // CRITICAL: Was permanently 'absent' in legacy backend!
    expect(dto.isLate).toBe(false);
    expect(dto.firstIn).toBe(clockInTime);
  });

  it('P0 FIX: clocking in late must update status to "late" with calculated lateMinutes', async () => {
    const lateClockInTime = '2026-10-15T09:40:00.000Z'; // 40 mins into shift, past 15 min grace

    const result = await useCase.execute(
      {
        employeeId: seededEmployee.id,
        type: 'in',
        timestamp: lateClockInTime,
      },
      {
        organizationId: orgId,
        requestId: 'req-2',
        correlationId: 'corr-2',
        roles: ['employee'],
        permissions: [],
      }
    );

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.status).toBe('late');
    expect(dto.isLate).toBe(true);
    expect(dto.lateMinutes).toBe(40);
  });

  it('P0 FIX: clocking out calculates net work hours deducting unpaid break', async () => {
    // 1. Clock in at 09:00
    await useCase.execute(
      {
        employeeId: seededEmployee.id,
        type: 'in',
        timestamp: '2026-10-15T09:00:00.000Z',
      },
      {
        organizationId: orgId,
        requestId: 'req-3',
        correlationId: 'corr-3',
        roles: ['employee'],
        permissions: [],
      }
    );

    // 2. Clock out at 18:00 (9 hours total span)
    const outResult = await useCase.execute(
      {
        employeeId: seededEmployee.id,
        type: 'out',
        timestamp: '2026-10-15T18:00:00.000Z',
      },
      {
        organizationId: orgId,
        requestId: 'req-4',
        correlationId: 'corr-4',
        roles: ['employee'],
        permissions: [],
      }
    );

    expect(outResult.isSuccess).toBe(true);
    const dto = outResult.getValue();
    // 9 hours gross - 1 hour unpaid break = 8 hours net
    expect(dto.totalWorkHours).toBe(8);
    expect(dto.status).toBe('present');
    expect(dto.punches.length).toBe(2);

    // Verify domain event dispatched
    expect(mockEventBus.publishDomainEvent).toHaveBeenCalled();
  });
});

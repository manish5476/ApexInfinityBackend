import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError, ValidationError } from '../../../../shared/errors';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { IShiftRepository } from '../../domain/ports/IShiftRepository';
import { IAttendanceDailyRepository } from '../../domain/ports/IAttendanceDailyRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { RecordPunchDto, AttendanceDailyResponseDto } from '../dto/AttendanceDto';
import { AttendanceMapper } from '../mappers/AttendanceMapper';
import { AttendanceDaily } from '../../domain/entities/AttendanceDaily';
import { DailyAttendanceRolledUpEvent } from '../../domain/events/DailyAttendanceRolledUpEvent';

export class ProcessAttendancePunchUseCase implements IUseCase<RecordPunchDto, AttendanceDailyResponseDto> {
  private readonly employeeRepo: IEmployeeRepository;
  private readonly shiftRepo: IShiftRepository;
  private readonly attendanceRepo: IAttendanceDailyRepository;
  private readonly mapper: AttendanceMapper;
  private readonly eventBus?: IEventBus;

  constructor(
    employeeRepo: IEmployeeRepository,
    shiftRepo: IShiftRepository,
    attendanceRepo: IAttendanceDailyRepository,
    mapper: AttendanceMapper,
    eventBus?: IEventBus
  ) {
    this.employeeRepo = employeeRepo;
    this.shiftRepo = shiftRepo;
    this.attendanceRepo = attendanceRepo;
    this.mapper = mapper;
    this.eventBus = eventBus;
  }

  public async execute(
    input: RecordPunchDto,
    context?: IApplicationContext
  ): Promise<Result<AttendanceDailyResponseDto>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required to process attendance punch.'));
    }

    // 1. Verify employee exists within tenant
    const employee = await this.employeeRepo.findById({
      organizationId,
      id: input.employeeId,
    });
    if (!employee) {
      return Result.fail(new NotFoundError('Employee', input.employeeId));
    }

    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
    const dayStart = new Date(timestamp);
    dayStart.setUTCHours(0, 0, 0, 0);

    // 2. Fetch employee's assigned Shift if configured
    let shift;
    if (employee.attendanceConfig.shiftId) {
      shift = await this.shiftRepo.findById({
        organizationId,
        id: employee.attendanceConfig.shiftId,
      });
    }

    // 3. Find or initialize today's AttendanceDaily record
    let attendance = await this.attendanceRepo.findByEmployeeAndDate(
      organizationId,
      employee.id,
      dayStart
    );

    if (!attendance) {
      attendance = AttendanceDaily.create({
        organizationId,
        employeeId: employee.id,
        date: dayStart,
        shiftId: shift?.id,
        initialStatus: 'absent',
      });
    }

    // 4. Record punch and roll up attendance status
    // FIXES P0 DEFECT: Properly marks employee as 'present', 'late', or 'half_day'
    attendance.recordPunch({
      type: input.type,
      timestamp,
      shift: shift ?? undefined,
      deviceId: input.deviceId,
      source: input.source ?? 'web',
    });

    // 5. Persist
    const saved = await this.attendanceRepo.save(attendance);

    // 6. Dispatch domain event
    if (this.eventBus) {
      await this.eventBus.publishDomainEvent(
        new DailyAttendanceRolledUpEvent({
          attendanceId: saved.id,
          organizationId: saved.organizationId,
          employeeId: saved.employeeId,
          date: saved.date,
          status: saved.status,
          totalWorkHours: saved.totalWorkHours,
        })
      );
    }

    return Result.ok(this.mapper.toDto(saved));
  }
}

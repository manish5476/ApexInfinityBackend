import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { ConflictError, ValidationError, NotFoundError } from '../../../../shared/errors';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { IUserRepository } from '../../../auth/domain/ports/IUserRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { CreateEmployeeDto, EmployeeResponseDto } from '../dto/EmployeeDto';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { Employee } from '../../domain/entities/Employee';

export class CreateEmployeeUseCase implements IUseCase<CreateEmployeeDto, EmployeeResponseDto> {
  private readonly employeeRepo: IEmployeeRepository;
  private readonly userRepo?: IUserRepository;
  private readonly mapper: EmployeeMapper;
  private readonly eventBus?: IEventBus;

  constructor(
    employeeRepo: IEmployeeRepository,
    mapper: EmployeeMapper,
    userRepo?: IUserRepository,
    eventBus?: IEventBus
  ) {
    this.employeeRepo = employeeRepo;
    this.mapper = mapper;
    this.userRepo = userRepo;
    this.eventBus = eventBus;
  }

  public async execute(
    input: CreateEmployeeDto,
    context?: IApplicationContext
  ): Promise<Result<EmployeeResponseDto>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required to create employee.'));
    }

    // 1. Enforce Employee Code uniqueness within tenant
    const existingCode = await this.employeeRepo.findByCode(organizationId, input.employeeCode);
    if (existingCode) {
      return Result.fail(new ConflictError(`Employee with code '${input.employeeCode}' already exists.`));
    }

    // 2. Enforce Email uniqueness within tenant
    const existingEmail = await this.employeeRepo.findByEmail(organizationId, input.email);
    if (existingEmail) {
      return Result.fail(new ConflictError(`Employee with email '${input.email}' already exists.`));
    }

    // 3. Verify user identity link if provided
    if (input.userId && this.userRepo) {
      const user = await this.userRepo.findById(input.userId);
      if (!user || (user.organizationId && user.organizationId !== organizationId)) {
        return Result.fail(new NotFoundError('User', input.userId));
      }

      // Check if user is already linked to another employee in this organization
      const existingUserLink = await this.employeeRepo.findByUserId(organizationId, input.userId);
      if (existingUserLink) {
        return Result.fail(new ConflictError(`User '${input.userId}' is already linked to employee '${existingUserLink.employeeCode.value}'.`));
      }
    }

    // 4. Create Employee Aggregate Root
    const employee = Employee.create({
      organizationId,
      employeeCode: input.employeeCode,
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      gender: input.gender,
      departmentId: input.departmentId,
      designationId: input.designationId,
      reportingManagerId: input.reportingManagerId,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
      workMode: input.workMode,
      employmentType: input.employmentType,
      shiftId: input.shiftId,
      allowWebPunch: input.allowWebPunch,
      biometricId: input.biometricId,
      bankDetails: input.bankDetails,
    });

    // 5. Persist
    const saved = await this.employeeRepo.save(employee);

    // 6. Dispatch domain events
    if (this.eventBus) {
      for (const event of employee.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      employee.clearDomainEvents();
    }

    return Result.ok(this.mapper.toDto(saved));
  }
}

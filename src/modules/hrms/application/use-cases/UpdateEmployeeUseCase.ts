import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError, ValidationError } from '../../../../shared/errors';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { UpdateEmployeeDto, EmployeeResponseDto } from '../dto/EmployeeDto';
import { EmployeeMapper } from '../mappers/EmployeeMapper';

export interface UpdateEmployeeInput {
  employeeId: string;
  data: UpdateEmployeeDto;
}

export class UpdateEmployeeUseCase implements IUseCase<UpdateEmployeeInput, EmployeeResponseDto> {
  private readonly employeeRepo: IEmployeeRepository;
  private readonly mapper: EmployeeMapper;

  constructor(employeeRepo: IEmployeeRepository, mapper: EmployeeMapper) {
    this.employeeRepo = employeeRepo;
    this.mapper = mapper;
  }

  public async execute(
    input: UpdateEmployeeInput,
    context?: IApplicationContext
  ): Promise<Result<EmployeeResponseDto>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required.'));
    }

    const employee = await this.employeeRepo.findById({
      organizationId,
      id: input.employeeId,
    });

    if (!employee) {
      return Result.fail(new NotFoundError('Employee', input.employeeId));
    }

    const { data } = input;

    // Update personal
    employee.updatePersonal({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
    });

    // Update employment
    employee.updateEmployment({
      departmentId: data.departmentId,
      designationId: data.designationId,
      reportingManagerId: data.reportingManagerId,
      workMode: data.workMode,
      employmentType: data.employmentType,
      status: data.status,
      exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
    });

    // Update attendance config
    employee.updateAttendanceConfig({
      shiftId: data.shiftId,
      allowWebPunch: data.allowWebPunch,
      biometricId: data.biometricId,
    });

    // Update bank details
    if (data.bankDetails) {
      employee.updateBankDetails(data.bankDetails);
    }

    const saved = await this.employeeRepo.save(employee);
    return Result.ok(this.mapper.toDto(saved));
  }
}

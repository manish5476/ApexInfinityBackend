import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError, ValidationError } from '../../../../shared/errors';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { EmployeeResponseDto } from '../dto/EmployeeDto';
import { EmployeeMapper } from '../mappers/EmployeeMapper';

export interface GetEmployeeByIdInput {
  employeeId: string;
}

export class GetEmployeeByIdUseCase implements IUseCase<GetEmployeeByIdInput, EmployeeResponseDto> {
  private readonly employeeRepo: IEmployeeRepository;
  private readonly mapper: EmployeeMapper;

  constructor(employeeRepo: IEmployeeRepository, mapper: EmployeeMapper) {
    this.employeeRepo = employeeRepo;
    this.mapper = mapper;
  }

  public async execute(
    input: GetEmployeeByIdInput,
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

    return Result.ok(this.mapper.toDto(employee));
  }
}

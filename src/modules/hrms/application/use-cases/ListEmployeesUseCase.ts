import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { ValidationError } from '../../../../shared/errors';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { EmployeeResponseDto } from '../dto/EmployeeDto';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { PaginatedResult, PaginationParams } from '../../../../shared/pagination';

export interface ListEmployeesInput {
  departmentId?: string;
  designationId?: string;
  status?: string;
  workMode?: string;
  search?: string;
  pagination?: PaginationParams;
}

export class ListEmployeesUseCase implements IUseCase<ListEmployeesInput, PaginatedResult<EmployeeResponseDto>> {
  private readonly employeeRepo: IEmployeeRepository;
  private readonly mapper: EmployeeMapper;

  constructor(employeeRepo: IEmployeeRepository, mapper: EmployeeMapper) {
    this.employeeRepo = employeeRepo;
    this.mapper = mapper;
  }

  public async execute(
    input: ListEmployeesInput,
    context?: IApplicationContext
  ): Promise<Result<PaginatedResult<EmployeeResponseDto>>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required.'));
    }

    const filter: Record<string, unknown> = {};
    if (input.departmentId) filter.departmentId = input.departmentId;
    if (input.designationId) filter.designationId = input.designationId;
    if (input.status) filter.status = input.status;
    if (input.workMode) filter.workMode = input.workMode;
    if (input.search) filter.search = input.search;

    const result = await this.employeeRepo.find({
      organizationId,
      filter,
      pagination: input.pagination,
    });

    const dtos = result.items.map((emp) => this.mapper.toDto(emp));

    return Result.ok({
      ...result,
      items: dtos,
    });
  }
}

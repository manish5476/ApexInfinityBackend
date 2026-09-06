import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { ValidationError } from '../../../../shared/errors';
import { IDepartmentRepository } from '../../domain/ports/IDepartmentRepository';
import { DepartmentResponseDto } from '../dto/DepartmentDto';
import { DepartmentMapper } from '../mappers/DepartmentMapper';
import { PaginatedResult, PaginationParams } from '../../../../shared/pagination';

export interface ListDepartmentsInput {
  search?: string;
  isActive?: boolean;
  pagination?: PaginationParams;
}

export class ListDepartmentsUseCase implements IUseCase<ListDepartmentsInput, PaginatedResult<DepartmentResponseDto>> {
  private readonly departmentRepo: IDepartmentRepository;
  private readonly mapper: DepartmentMapper;

  constructor(departmentRepo: IDepartmentRepository, mapper: DepartmentMapper) {
    this.departmentRepo = departmentRepo;
    this.mapper = mapper;
  }

  public async execute(
    input: ListDepartmentsInput,
    context?: IApplicationContext
  ): Promise<Result<PaginatedResult<DepartmentResponseDto>>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required.'));
    }

    const filter: Record<string, unknown> = {};
    if (input.isActive !== undefined) filter.isActive = input.isActive;
    if (input.search) filter.search = input.search;

    const result = await this.departmentRepo.find({
      organizationId,
      filter,
      pagination: input.pagination,
    });

    const dtos = result.items.map((dept) => this.mapper.toDto(dept));

    return Result.ok({
      ...result,
      items: dtos,
    });
  }
}

import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { ConflictError, ValidationError } from '../../../../shared/errors';
import { IDepartmentRepository } from '../../domain/ports/IDepartmentRepository';
import { CreateDepartmentDto, DepartmentResponseDto } from '../dto/DepartmentDto';
import { DepartmentMapper } from '../mappers/DepartmentMapper';
import { Department } from '../../domain/entities/Department';

export class CreateDepartmentUseCase implements IUseCase<CreateDepartmentDto, DepartmentResponseDto> {
  private readonly departmentRepo: IDepartmentRepository;
  private readonly mapper: DepartmentMapper;

  constructor(departmentRepo: IDepartmentRepository, mapper: DepartmentMapper) {
    this.departmentRepo = departmentRepo;
    this.mapper = mapper;
  }

  public async execute(
    input: CreateDepartmentDto,
    context?: IApplicationContext
  ): Promise<Result<DepartmentResponseDto>> {
    const organizationId = context?.organizationId;
    if (!organizationId) {
      return Result.fail(new ValidationError('Organization context is required.'));
    }

    const existing = await this.departmentRepo.findByCode(organizationId, input.code);
    if (existing) {
      return Result.fail(new ConflictError(`Department with code '${input.code}' already exists.`));
    }

    const department = Department.create({
      organizationId,
      name: input.name,
      code: input.code,
      description: input.description,
      parentId: input.parentId,
      managerId: input.managerId,
    });

    const saved = await this.departmentRepo.save(department);
    return Result.ok(this.mapper.toDto(saved));
  }
}

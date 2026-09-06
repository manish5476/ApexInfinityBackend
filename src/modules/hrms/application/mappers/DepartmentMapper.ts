import { IMapper } from '../../../../core/application/IMapper';
import { Department, DepartmentProps } from '../../domain/entities/Department';
import { DepartmentResponseDto } from '../dto/DepartmentDto';
export { DepartmentResponseDto };

export class DepartmentMapper implements IMapper<Department, any, DepartmentResponseDto> {
  public toDomain(raw: any): Department {
    const props: DepartmentProps = {
      organizationId: raw.organizationId,
      name: raw.name,
      code: raw.code,
      description: raw.description || undefined,
      parentId: raw.parentId || undefined,
      managerId: raw.managerId || undefined,
      isActive: raw.isActive ?? true,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };

    return Department.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: Department): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      code: domain.code,
      description: domain.description,
      parentId: domain.parentId,
      managerId: domain.managerId,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: Department): DepartmentResponseDto {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      code: domain.code,
      description: domain.description,
      parentId: domain.parentId,
      managerId: domain.managerId,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

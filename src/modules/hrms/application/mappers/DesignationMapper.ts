import { IMapper } from '../../../../core/application/IMapper';
import { Designation, DesignationProps } from '../../domain/entities/Designation';

export interface DesignationResponseDto {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  departmentId?: string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class DesignationMapper implements IMapper<Designation, any, DesignationResponseDto> {
  public toDomain(raw: any): Designation {
    const props: DesignationProps = {
      organizationId: raw.organizationId,
      title: raw.title,
      code: raw.code,
      departmentId: raw.departmentId || undefined,
      level: raw.level ?? 1,
      isActive: raw.isActive ?? true,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return Designation.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: Designation): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      title: domain.title,
      code: domain.code,
      departmentId: domain.departmentId,
      level: domain.level,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: Designation): DesignationResponseDto {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      title: domain.title,
      code: domain.code,
      departmentId: domain.departmentId,
      level: domain.level,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

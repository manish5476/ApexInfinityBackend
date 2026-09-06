import { IMapper } from '../../../../core/application/IMapper';
import { ShiftGroup, ShiftGroupProps } from '../../domain/entities/ShiftGroup';

export class ShiftGroupMapper implements IMapper<ShiftGroup, any, any> {
  public toDomain(raw: any): ShiftGroup {
    const props: ShiftGroupProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      name: raw.name,
      code: raw.code,
      description: raw.description || undefined,
      shifts: raw.shifts || [],
      rotationType: raw.rotationType || 'weekly',
      rotationPattern: raw.rotationPattern || [],
      applicableDepartments: raw.applicableDepartments || [],
      applicableDesignations: raw.applicableDesignations || [],
      isActive: raw.isActive ?? true,
      effectiveFrom: raw.effectiveFrom ? new Date(raw.effectiveFrom) : undefined,
      effectiveTo: raw.effectiveTo ? new Date(raw.effectiveTo) : undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return ShiftGroup.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: ShiftGroup): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      code: domain.code,
      description: domain.description,
      shifts: domain.shifts,
      rotationType: domain.rotationType,
      rotationPattern: domain.rotationPattern,
      applicableDepartments: domain.applicableDepartments,
      applicableDesignations: domain.applicableDesignations,
      isActive: domain.isActive,
      effectiveFrom: domain.effectiveFrom,
      effectiveTo: domain.effectiveTo,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: ShiftGroup): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      code: domain.code,
      description: domain.description,
      shifts: domain.shifts,
      rotationType: domain.rotationType,
      rotationPattern: domain.rotationPattern,
      applicableDepartments: domain.applicableDepartments,
      applicableDesignations: domain.applicableDesignations,
      isActive: domain.isActive,
      effectiveFrom: domain.effectiveFrom?.toISOString(),
      effectiveTo: domain.effectiveTo?.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

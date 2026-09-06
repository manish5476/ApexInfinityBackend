import { IMapper } from '../../../../core/application/IMapper';
import { GeoFence, GeoFenceProps } from '../../domain/entities/GeoFence';

export class GeoFenceMapper implements IMapper<GeoFence, any, any> {
  public toDomain(raw: any): GeoFence {
    const props: GeoFenceProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      name: raw.name,
      description: raw.description || undefined,
      latitude: raw.latitude,
      longitude: raw.longitude,
      radius: raw.radius ?? 100,
      assignedUsers: raw.assignedUsers || [],
      assignedDepartments: raw.assignedDepartments || [],
      isActive: raw.isActive ?? true,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return GeoFence.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: GeoFence): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      description: domain.description,
      latitude: domain.latitude,
      longitude: domain.longitude,
      radius: domain.radius,
      assignedUsers: domain.assignedUsers,
      assignedDepartments: domain.assignedDepartments,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: GeoFence): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      description: domain.description,
      latitude: domain.latitude,
      longitude: domain.longitude,
      radius: domain.radius,
      assignedUsers: domain.assignedUsers,
      assignedDepartments: domain.assignedDepartments,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

import { ITenantRepository } from '../../../../core/domain/IRepository';
import { GeoFence } from '../entities/GeoFence';

export interface IGeoFenceRepository extends ITenantRepository<GeoFence, string> {
  findAll(organizationId: string, filter?: { isActive?: boolean; branchId?: string }): Promise<GeoFence[]>;
}

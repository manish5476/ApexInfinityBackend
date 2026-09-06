import { IGeoFenceRepository } from '../../domain/ports/IGeoFenceRepository';
import { GeoFence } from '../../domain/entities/GeoFence';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryGeoFenceRepository implements IGeoFenceRepository {
  private readonly items: Map<string, GeoFence> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<GeoFence | null> {
    const gf = this.items.get(scope.id);
    if (gf && gf.organizationId === scope.organizationId) {
      return gf;
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; branchId?: string }): Promise<GeoFence[]> {
    return Array.from(this.items.values()).filter((g) => {
      if (g.organizationId !== organizationId) return false;
      if (filter?.isActive !== undefined && g.isActive !== filter.isActive) return false;
      if (filter?.branchId && g.branchId !== filter.branchId) return false;
      return true;
    });
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<GeoFence>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: GeoFence): Promise<GeoFence> {
    this.items.set(entity.id, entity);
    return entity;
  }

  public async delete(scope: TenantScopedId<string>): Promise<boolean> {
    const existing = await this.findById(scope);
    if (existing) {
      return this.items.delete(scope.id);
    }
    return false;
  }

  public async exists(scope: TenantScopedId<string>): Promise<boolean> {
    const existing = await this.findById(scope);
    return existing !== null;
  }

  public clear(): void {
    this.items.clear();
  }
}

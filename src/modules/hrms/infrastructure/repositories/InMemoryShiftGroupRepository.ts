import { IShiftGroupRepository } from '../../domain/ports/IShiftGroupRepository';
import { ShiftGroup } from '../../domain/entities/ShiftGroup';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryShiftGroupRepository implements IShiftGroupRepository {
  private readonly items: Map<string, ShiftGroup> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<ShiftGroup | null> {
    const group = this.items.get(scope.id);
    if (group && group.organizationId === scope.organizationId) {
      return group;
    }
    return null;
  }

  public async findByCode(organizationId: string, code: string): Promise<ShiftGroup | null> {
    const target = code.toUpperCase().trim();
    for (const group of this.items.values()) {
      if (group.organizationId === organizationId && group.code === target) {
        return group;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<ShiftGroup[]> {
    let list = Array.from(this.items.values()).filter((g) => g.organizationId === organizationId);
    if (filter?.isActive !== undefined) list = list.filter((g) => g.isActive === filter.isActive);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q));
    }
    return list;
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<ShiftGroup>> {
    let list = Array.from(this.items.values()).filter(
      (group) => group.organizationId === query.organizationId
    );

    if (query.filter?.isActive !== undefined) {
      list = list.filter((group) => group.isActive === query.filter!.isActive);
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: ShiftGroup): Promise<ShiftGroup> {
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

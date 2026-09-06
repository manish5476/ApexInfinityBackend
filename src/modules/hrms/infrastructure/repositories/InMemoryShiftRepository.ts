import { IShiftRepository } from '../../domain/ports/IShiftRepository';
import { Shift } from '../../domain/entities/Shift';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryShiftRepository implements IShiftRepository {
  private readonly items: Map<string, Shift> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Shift | null> {
    const shift = this.items.get(scope.id);
    if (shift && shift.organizationId === scope.organizationId) {
      return shift;
    }
    return null;
  }

  public async findByCode(organizationId: string, code: string): Promise<Shift | null> {
    const target = code.toUpperCase().trim();
    for (const shift of this.items.values()) {
      if (shift.organizationId === organizationId && shift.code === target) {
        return shift;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Shift[]> {
    let list = Array.from(this.items.values()).filter((s) => s.organizationId === organizationId);
    if (filter?.isActive !== undefined) {
      list = list.filter((s) => s.isActive === filter.isActive);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    return list;
  }


  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Shift>> {
    let list = Array.from(this.items.values()).filter(
      (shift) => shift.organizationId === query.organizationId
    );

    if (query.filter?.isActive !== undefined) {
      list = list.filter((shift) => shift.isActive === query.filter!.isActive);
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Shift): Promise<Shift> {
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

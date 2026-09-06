import { IHolidayRepository } from '../../domain/ports/IHolidayRepository';
import { Holiday } from '../../domain/entities/Holiday';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryHolidayRepository implements IHolidayRepository {
  private readonly items: Map<string, Holiday> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Holiday | null> {
    const h = this.items.get(scope.id);
    if (h && h.organizationId === scope.organizationId) {
      return h;
    }
    return null;
  }

  public async findByYear(organizationId: string, year: number, branchId?: string): Promise<Holiday[]> {
    return Array.from(this.items.values()).filter((h) => {
      if (h.organizationId !== organizationId || h.year !== year) return false;
      if (branchId && h.branchId && h.branchId !== branchId) return false;
      return true;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  public async findByDate(organizationId: string, date: Date, branchId?: string): Promise<Holiday | null> {
    const target = new Date(date).setUTCHours(0, 0, 0, 0);
    for (const h of this.items.values()) {
      if (h.organizationId === organizationId && h.date.getTime() === target) {
        if (!branchId || !h.branchId || h.branchId === branchId) {
          return h;
        }
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { year?: number; branchId?: string; isActive?: boolean }): Promise<Holiday[]> {
    return Array.from(this.items.values()).filter((h) => {
      if (h.organizationId !== organizationId) return false;
      if (filter?.year && h.year !== filter.year) return false;
      if (filter?.branchId && h.branchId && h.branchId !== filter.branchId) return false;
      if (filter?.isActive !== undefined && h.isActive !== filter.isActive) return false;
      return true;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  public async saveMany(holidays: Holiday[]): Promise<void> {
    for (const h of holidays) {
      this.items.set(h.id, h);
    }
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Holiday>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Holiday): Promise<Holiday> {
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

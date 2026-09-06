import { ISalaryStructureRepository } from '../../domain/ports/ISalaryStructureRepository';
import { SalaryStructure } from '../../domain/entities/SalaryStructure';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemorySalaryStructureRepository implements ISalaryStructureRepository {
  private readonly items: Map<string, SalaryStructure> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<SalaryStructure | null> {
    const s = this.items.get(scope.id);
    if (s && s.organizationId === scope.organizationId) {
      return s;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<SalaryStructure | null> {
    const list = Array.from(this.items.values()).filter(
      (s) => s.organizationId === organizationId && s.userId === userId && s.status === 'active'
    ).sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
    return list[0] || null;
  }

  public async findAll(organizationId: string, filter?: { status?: string; search?: string }): Promise<SalaryStructure[]> {
    return Array.from(this.items.values()).filter((s) => {
      if (s.organizationId !== organizationId) return false;
      if (filter?.status && s.status !== filter.status) return false;
      if (filter?.search && !s.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<SalaryStructure>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: SalaryStructure): Promise<SalaryStructure> {
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

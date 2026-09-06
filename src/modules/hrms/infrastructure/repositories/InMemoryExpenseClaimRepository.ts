import { IExpenseClaimRepository } from '../../domain/ports/IExpenseClaimRepository';
import { ExpenseClaim } from '../../domain/entities/ExpenseClaim';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryExpenseClaimRepository implements IExpenseClaimRepository {
  private readonly items: Map<string, ExpenseClaim> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<ExpenseClaim | null> {
    const claim = this.items.get(scope.id);
    if (claim && claim.organizationId === scope.organizationId) {
      return claim;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<ExpenseClaim[]> {
    return Array.from(this.items.values()).filter(
      (c) => c.organizationId === organizationId && c.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async findAll(organizationId: string, filter?: { userId?: string; status?: string; branchId?: string }): Promise<ExpenseClaim[]> {
    return Array.from(this.items.values()).filter((c) => {
      if (c.organizationId !== organizationId) return false;
      if (filter?.userId && c.userId !== filter.userId) return false;
      if (filter?.status && c.status !== filter.status) return false;
      if (filter?.branchId && c.branchId !== filter.branchId) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<ExpenseClaim>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: ExpenseClaim): Promise<ExpenseClaim> {
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

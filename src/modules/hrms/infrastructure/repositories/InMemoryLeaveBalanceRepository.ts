import { ILeaveBalanceRepository } from '../../domain/ports/ILeaveBalanceRepository';
import { LeaveBalance } from '../../domain/entities/LeaveBalance';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryLeaveBalanceRepository implements ILeaveBalanceRepository {
  private readonly items: Map<string, LeaveBalance> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<LeaveBalance | null> {
    const lb = this.items.get(scope.id);
    if (lb && lb.organizationId === scope.organizationId) {
      return lb;
    }
    return null;
  }

  public async findByUserAndYear(organizationId: string, userId: string, financialYear: string): Promise<LeaveBalance | null> {
    for (const b of this.items.values()) {
      if (b.organizationId === organizationId && b.userId === userId && b.financialYear === financialYear) {
        return b;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { financialYear?: string; branchId?: string }): Promise<LeaveBalance[]> {
    return Array.from(this.items.values()).filter((b) => {
      if (b.organizationId !== organizationId) return false;
      if (filter?.financialYear && b.financialYear !== filter.financialYear) return false;
      if (filter?.branchId && b.branchId !== filter.branchId) return false;
      return true;
    });
  }

  public async saveMany(balances: LeaveBalance[]): Promise<void> {
    for (const b of balances) {
      this.items.set(b.id, b);
    }
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<LeaveBalance>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: LeaveBalance): Promise<LeaveBalance> {
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

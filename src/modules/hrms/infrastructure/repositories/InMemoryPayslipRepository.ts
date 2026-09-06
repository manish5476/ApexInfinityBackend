import { IPayslipRepository } from '../../domain/ports/IPayslipRepository';
import { Payslip } from '../../domain/entities/Payslip';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryPayslipRepository implements IPayslipRepository {
  private readonly items: Map<string, Payslip> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Payslip | null> {
    const p = this.items.get(scope.id);
    if (p && p.organizationId === scope.organizationId) {
      return p;
    }
    return null;
  }

  public async findByUserAndPeriod(organizationId: string, userId: string, month: number, year: number): Promise<Payslip | null> {
    for (const p of this.items.values()) {
      if (p.organizationId === organizationId && p.userId === userId && p.month === month && p.year === year) {
        return p;
      }
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<Payslip[]> {
    return Array.from(this.items.values()).filter(
      (p) => p.organizationId === organizationId && p.userId === userId
    ).sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; month?: number; year?: number; status?: string }): Promise<Payslip[]> {
    return Array.from(this.items.values()).filter((p) => {
      if (p.organizationId !== organizationId) return false;
      if (filter?.userId && p.userId !== filter.userId) return false;
      if (filter?.month && p.month !== filter.month) return false;
      if (filter?.year && p.year !== filter.year) return false;
      if (filter?.status && p.status !== filter.status) return false;
      return true;
    }).sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month));
  }

  public async saveMany(payslips: Payslip[]): Promise<void> {
    for (const p of payslips) {
      this.items.set(p.id, p);
    }
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Payslip>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Payslip): Promise<Payslip> {
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

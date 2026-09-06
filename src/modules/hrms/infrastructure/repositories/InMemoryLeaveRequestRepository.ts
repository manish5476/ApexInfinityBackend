import { ILeaveRequestRepository } from '../../domain/ports/ILeaveRequestRepository';
import { LeaveRequest } from '../../domain/entities/LeaveRequest';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryLeaveRequestRepository implements ILeaveRequestRepository {
  private readonly items: Map<string, LeaveRequest> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<LeaveRequest | null> {
    const lr = this.items.get(scope.id);
    if (lr && lr.organizationId === scope.organizationId) {
      return lr;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<LeaveRequest[]> {
    return Array.from(this.items.values()).filter(
      (lr) => lr.organizationId === organizationId && lr.userId === userId
    ).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  public async findByApprover(organizationId: string, approverId: string, status?: string): Promise<LeaveRequest[]> {
    return Array.from(this.items.values()).filter((lr) => {
      if (lr.organizationId !== organizationId || lr.assignedApprover !== approverId) return false;
      if (status && lr.status !== status) return false;
      return true;
    }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  public async findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string; departmentId?: string; from?: Date; to?: Date }): Promise<LeaveRequest[]> {
    return Array.from(this.items.values()).filter((lr) => {
      if (lr.organizationId !== organizationId) return false;
      if (filter?.userId && lr.userId !== filter.userId) return false;
      if (filter?.approverId && lr.assignedApprover !== filter.approverId) return false;
      if (filter?.status && lr.status !== filter.status) return false;
      if (filter?.departmentId && lr.departmentId !== filter.departmentId) return false;
      if (filter?.from && lr.startDate < filter.from) return false;
      if (filter?.to && lr.startDate > filter.to) return false;
      return true;
    }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<LeaveRequest>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: LeaveRequest): Promise<LeaveRequest> {
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

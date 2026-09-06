import { IAttendanceRequestRepository } from '../../domain/ports/IAttendanceRequestRepository';
import { AttendanceRequest } from '../../domain/entities/AttendanceRequest';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryAttendanceRequestRepository implements IAttendanceRequestRepository {
  private readonly items: Map<string, AttendanceRequest> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<AttendanceRequest | null> {
    const req = this.items.get(scope.id);
    if (req && req.organizationId === scope.organizationId) {
      return req;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<AttendanceRequest[]> {
    return Array.from(this.items.values()).filter(
      (r) => r.organizationId === organizationId && r.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async findByApprover(organizationId: string, approverId: string, status?: string): Promise<AttendanceRequest[]> {
    return Array.from(this.items.values()).filter((r) => {
      if (r.organizationId !== organizationId || r.assignedApprover !== approverId) return false;
      if (status && r.status !== status) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string }): Promise<AttendanceRequest[]> {
    return Array.from(this.items.values()).filter((r) => {
      if (r.organizationId !== organizationId) return false;
      if (filter?.userId && r.userId !== filter.userId) return false;
      if (filter?.approverId && r.assignedApprover !== filter.approverId) return false;
      if (filter?.status && r.status !== filter.status) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<AttendanceRequest>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: AttendanceRequest): Promise<AttendanceRequest> {
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

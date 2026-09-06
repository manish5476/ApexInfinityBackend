import { IAttendanceLogRepository } from '../../domain/ports/IAttendanceLogRepository';
import { AttendanceLog } from '../../domain/entities/AttendanceLog';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryAttendanceLogRepository implements IAttendanceLogRepository {
  private readonly items: Map<string, AttendanceLog> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<AttendanceLog | null> {
    const log = this.items.get(scope.id);
    if (log && log.organizationId === scope.organizationId) {
      return log;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string, from?: Date, to?: Date): Promise<AttendanceLog[]> {
    return Array.from(this.items.values()).filter((l) => {
      if (l.organizationId !== organizationId || l.userId !== userId) return false;
      if (from && l.timestamp < from) return false;
      if (to && l.timestamp > to) return false;
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async findAll(organizationId: string, filter?: { userId?: string; machineId?: string; from?: Date; to?: Date; isFlagged?: boolean }): Promise<AttendanceLog[]> {
    return Array.from(this.items.values()).filter((l) => {
      if (l.organizationId !== organizationId) return false;
      if (filter?.userId && l.userId !== filter.userId) return false;
      if (filter?.machineId && l.machineId !== filter.machineId) return false;
      if (filter?.isFlagged !== undefined && l.isFlagged !== filter.isFlagged) return false;
      if (filter?.from && l.timestamp < filter.from) return false;
      if (filter?.to && l.timestamp > filter.to) return false;
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async saveMany(logs: AttendanceLog[]): Promise<void> {
    for (const log of logs) {
      this.items.set(log.id, log);
    }
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<AttendanceLog>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: AttendanceLog): Promise<AttendanceLog> {
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

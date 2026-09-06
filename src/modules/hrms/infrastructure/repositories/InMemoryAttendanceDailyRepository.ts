import { IAttendanceDailyRepository } from '../../domain/ports/IAttendanceDailyRepository';
import { AttendanceDaily } from '../../domain/entities/AttendanceDaily';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryAttendanceDailyRepository implements IAttendanceDailyRepository {
  private readonly items: Map<string, AttendanceDaily> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<AttendanceDaily | null> {
    const record = this.items.get(scope.id);
    if (record && record.organizationId === scope.organizationId) {
      return record;
    }
    return null;
  }

  public async findByEmployeeAndDate(
    organizationId: string,
    employeeId: string,
    date: Date
  ): Promise<AttendanceDaily | null> {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);
    const targetTime = targetDate.getTime();

    for (const record of this.items.values()) {
      if (
        record.organizationId === organizationId &&
        record.employeeId === employeeId &&
        record.date.getTime() === targetTime
      ) {
        return record;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { employeeId?: string; date?: Date; from?: Date; to?: Date; status?: string }): Promise<AttendanceDaily[]> {
    let list = Array.from(this.items.values()).filter((r) => r.organizationId === organizationId);
    if (filter?.employeeId) list = list.filter((r) => r.employeeId === filter.employeeId);
    if (filter?.status) list = list.filter((r) => r.status === filter.status);
    if (filter?.date) {
      const targetTime = new Date(filter.date).setUTCHours(0, 0, 0, 0);
      list = list.filter((r) => r.date.getTime() === targetTime);
    }
    return list;
  }


  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<AttendanceDaily>> {
    let list = Array.from(this.items.values()).filter(
      (r) => r.organizationId === query.organizationId
    );

    if (query.filter?.employeeId) {
      list = list.filter((r) => r.employeeId === query.filter!.employeeId);
    }
    if (query.filter?.status) {
      list = list.filter((r) => r.status === query.filter!.status);
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: AttendanceDaily): Promise<AttendanceDaily> {
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

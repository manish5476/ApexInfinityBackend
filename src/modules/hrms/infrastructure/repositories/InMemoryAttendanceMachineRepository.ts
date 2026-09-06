import { IAttendanceMachineRepository } from '../../domain/ports/IAttendanceMachineRepository';
import { AttendanceMachine } from '../../domain/entities/AttendanceMachine';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryAttendanceMachineRepository implements IAttendanceMachineRepository {
  private readonly items: Map<string, AttendanceMachine> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<AttendanceMachine | null> {
    const m = this.items.get(scope.id);
    if (m && m.organizationId === scope.organizationId) {
      return m;
    }
    return null;
  }

  public async findBySerialNumber(organizationId: string, serialNumber: string): Promise<AttendanceMachine | null> {
    for (const m of this.items.values()) {
      if (m.organizationId === organizationId && m.serialNumber === serialNumber) {
        return m;
      }
    }
    return null;
  }

  public async findByApiKey(apiKey: string): Promise<AttendanceMachine | null> {
    for (const m of this.items.values()) {
      if (m.apiKey === apiKey) {
        return m;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { status?: string; branchId?: string }): Promise<AttendanceMachine[]> {
    return Array.from(this.items.values()).filter((m) => {
      if (m.organizationId !== organizationId) return false;
      if (filter?.status && m.status !== filter.status) return false;
      if (filter?.branchId && m.branchId !== filter.branchId) return false;
      return true;
    });
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<AttendanceMachine>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: AttendanceMachine): Promise<AttendanceMachine> {
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

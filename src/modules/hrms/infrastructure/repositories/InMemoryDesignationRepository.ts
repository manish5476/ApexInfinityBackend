import { IDesignationRepository } from '../../domain/ports/IDesignationRepository';
import { Designation } from '../../domain/entities/Designation';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryDesignationRepository implements IDesignationRepository {
  private readonly items: Map<string, Designation> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Designation | null> {
    const desig = this.items.get(scope.id);
    if (desig && desig.organizationId === scope.organizationId) {
      return desig;
    }
    return null;
  }

  public async findByCode(organizationId: string, code: string): Promise<Designation | null> {
    const target = code.toUpperCase().trim();
    for (const desig of this.items.values()) {
      if (desig.organizationId === organizationId && desig.code === target) {
        return desig;
      }
    }
    return null;
  }

  public async findByDepartmentId(organizationId: string, departmentId: string): Promise<Designation[]> {
    return Array.from(this.items.values()).filter(
      (desig) => desig.organizationId === organizationId && desig.departmentId === departmentId
    );
  }

  public async findAll(organizationId: string, filter?: { departmentId?: string; isActive?: boolean; search?: string }): Promise<Designation[]> {
    let list = Array.from(this.items.values()).filter((d) => d.organizationId === organizationId);
    if (filter?.departmentId) list = list.filter((d) => d.departmentId === filter.departmentId);
    if (filter?.isActive !== undefined) list = list.filter((d) => d.isActive === filter.isActive);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    return list;
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Designation>> {
    let list = Array.from(this.items.values()).filter(
      (desig) => desig.organizationId === query.organizationId
    );

    if (query.filter?.departmentId) {
      list = list.filter((desig) => desig.departmentId === query.filter!.departmentId);
    }
    if (query.filter?.isActive !== undefined) {
      list = list.filter((desig) => desig.isActive === query.filter!.isActive);
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Designation): Promise<Designation> {
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

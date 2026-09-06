import { IDepartmentRepository } from '../../domain/ports/IDepartmentRepository';
import { Department } from '../../domain/entities/Department';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryDepartmentRepository implements IDepartmentRepository {
  private readonly items: Map<string, Department> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Department | null> {
    const dept = this.items.get(scope.id);
    if (dept && dept.organizationId === scope.organizationId) {
      return dept;
    }
    return null;
  }

  public async findByCode(organizationId: string, code: string): Promise<Department | null> {
    const target = code.toUpperCase().trim();
    for (const dept of this.items.values()) {
      if (dept.organizationId === organizationId && dept.code === target) {
        return dept;
      }
    }
    return null;
  }

  public async findByParentId(organizationId: string, parentId?: string): Promise<Department[]> {
    return Array.from(this.items.values()).filter(
      (dept) => dept.organizationId === organizationId && dept.parentId === parentId
    );
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Department[]> {
    let list = Array.from(this.items.values()).filter((d) => d.organizationId === organizationId);
    if (filter?.isActive !== undefined) {
      list = list.filter((d) => d.isActive === filter.isActive);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    return list;
  }


  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Department>> {
    let list = Array.from(this.items.values()).filter(
      (dept) => dept.organizationId === query.organizationId
    );

    if (query.filter?.isActive !== undefined) {
      list = list.filter((dept) => dept.isActive === query.filter!.isActive);
    }
    if (query.filter?.search) {
      const q = String(query.filter.search).toLowerCase();
      list = list.filter(
        (dept) => dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q)
      );
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Department): Promise<Department> {
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

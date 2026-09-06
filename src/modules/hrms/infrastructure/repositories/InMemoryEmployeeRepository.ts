import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { Employee } from '../../domain/entities/Employee';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryEmployeeRepository implements IEmployeeRepository {
  private readonly items: Map<string, Employee> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<Employee | null> {
    const emp = this.items.get(scope.id);
    if (emp && emp.organizationId === scope.organizationId) {
      return emp;
    }
    return null;
  }

  public async findByCode(organizationId: string, code: string): Promise<Employee | null> {
    const target = code.toUpperCase().trim();
    for (const emp of this.items.values()) {
      if (emp.organizationId === organizationId && emp.employeeCode.value === target) {
        return emp;
      }
    }
    return null;
  }

  public async findByUserId(organizationId: string, userId: string): Promise<Employee | null> {
    for (const emp of this.items.values()) {
      if (emp.organizationId === organizationId && emp.userId === userId) {
        return emp;
      }
    }
    return null;
  }

  public async findByEmail(organizationId: string, email: string): Promise<Employee | null> {
    const target = email.toLowerCase().trim();
    for (const emp of this.items.values()) {
      if (emp.organizationId === organizationId && emp.personal.email.value === target) {
        return emp;
      }
    }
    return null;
  }

  public async findAll(organizationId: string, filter?: { departmentId?: string; designationId?: string; status?: string; branchId?: string; search?: string }): Promise<Employee[]> {
    let list = Array.from(this.items.values()).filter((e) => e.organizationId === organizationId);
    if (filter?.departmentId) list = list.filter((e) => e.employment.departmentId === filter.departmentId);
    if (filter?.designationId) list = list.filter((e) => e.employment.designationId === filter.designationId);
    if (filter?.status) list = list.filter((e) => e.employment.status === filter.status);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((e) => e.fullName.toLowerCase().includes(q) || e.employeeCode.value.toLowerCase().includes(q) || e.personal.email.value.toLowerCase().includes(q));
    }
    return list;
  }


  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<Employee>> {
    let list = Array.from(this.items.values()).filter(
      (emp) => emp.organizationId === query.organizationId
    );

    if (query.filter?.departmentId) {
      list = list.filter((emp) => emp.employment.departmentId === query.filter!.departmentId);
    }
    if (query.filter?.status) {
      list = list.filter((emp) => emp.employment.status === query.filter!.status);
    }
    if (query.filter?.workMode) {
      list = list.filter((emp) => emp.employment.workMode === query.filter!.workMode);
    }
    if (query.filter?.search) {
      const q = String(query.filter.search).toLowerCase();
      list = list.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeCode.value.toLowerCase().includes(q) ||
          emp.personal.email.value.toLowerCase().includes(q)
      );
    }

    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: Employee): Promise<Employee> {
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

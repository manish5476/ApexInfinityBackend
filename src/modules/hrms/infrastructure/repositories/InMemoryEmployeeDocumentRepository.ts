import { IEmployeeDocumentRepository } from '../../domain/ports/IEmployeeDocumentRepository';
import { EmployeeDocument } from '../../domain/entities/EmployeeDocument';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryEmployeeDocumentRepository implements IEmployeeDocumentRepository {
  private readonly items: Map<string, EmployeeDocument> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<EmployeeDocument | null> {
    const doc = this.items.get(scope.id);
    if (doc && doc.organizationId === scope.organizationId) {
      return doc;
    }
    return null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<EmployeeDocument[]> {
    return Array.from(this.items.values()).filter(
      (d) => d.organizationId === organizationId && d.userId === userId
    );
  }

  public async findByEmployeeRef(organizationId: string, employeeRef: string): Promise<EmployeeDocument[]> {
    return Array.from(this.items.values()).filter(
      (d) => d.organizationId === organizationId && d.employeeRef === employeeRef
    );
  }

  public async findAll(organizationId: string, filter?: { userId?: string; employeeRef?: string; documentType?: string; status?: string }): Promise<EmployeeDocument[]> {
    return Array.from(this.items.values()).filter((d) => {
      if (d.organizationId !== organizationId) return false;
      if (filter?.userId && d.userId !== filter.userId) return false;
      if (filter?.employeeRef && d.employeeRef !== filter.employeeRef) return false;
      if (filter?.documentType && d.documentType !== filter.documentType) return false;
      if (filter?.status && d.status !== filter.status) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<EmployeeDocument>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: EmployeeDocument): Promise<EmployeeDocument> {
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

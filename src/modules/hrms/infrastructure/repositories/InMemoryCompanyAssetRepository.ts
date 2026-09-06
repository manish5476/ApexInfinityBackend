import { ICompanyAssetRepository } from '../../domain/ports/ICompanyAssetRepository';
import { CompanyAsset } from '../../domain/entities/CompanyAsset';
import { TenantScopedId, TenantQueryCriteria } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryCompanyAssetRepository implements ICompanyAssetRepository {
  private readonly items: Map<string, CompanyAsset> = new Map();

  public async findById(scope: TenantScopedId<string>): Promise<CompanyAsset | null> {
    const asset = this.items.get(scope.id);
    if (asset && asset.organizationId === scope.organizationId) {
      return asset;
    }
    return null;
  }

  public async findByCode(organizationId: string, assetCode: string): Promise<CompanyAsset | null> {
    const target = assetCode.toUpperCase().trim();
    for (const a of this.items.values()) {
      if (a.organizationId === organizationId && a.assetCode === target) {
        return a;
      }
    }
    return null;
  }

  public async findByAssignedUser(organizationId: string, userId: string): Promise<CompanyAsset[]> {
    return Array.from(this.items.values()).filter(
      (a) => a.organizationId === organizationId && a.assignedTo === userId
    );
  }

  public async findByEmployeeRef(organizationId: string, employeeRef: string): Promise<CompanyAsset[]> {
    return Array.from(this.items.values()).filter(
      (a) => a.organizationId === organizationId && a.employeeRef === employeeRef
    );
  }

  public async findAll(organizationId: string, filter?: { status?: string; category?: string; branchId?: string; search?: string }): Promise<CompanyAsset[]> {
    return Array.from(this.items.values()).filter((a) => {
      if (a.organizationId !== organizationId) return false;
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.category && a.category !== filter.category) return false;
      if (filter?.branchId && a.branchId !== filter.branchId) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.assetCode.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<CompanyAsset>> {
    const list = await this.findAll(query.organizationId, query.filter);
    const pagination: PaginationParams = query.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);
    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public async save(entity: CompanyAsset): Promise<CompanyAsset> {
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

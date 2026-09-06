import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { Organization } from '../../domain/entities/Organization';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryOrganizationRepository implements IOrganizationRepository {
  private readonly items: Map<string, Organization> = new Map();

  public async findById(id: string): Promise<Organization | null> {
    return this.items.get(id) || null;
  }

  public async findBySlug(slug: string): Promise<Organization | null> {
    const target = slug.toLowerCase();
    for (const org of this.items.values()) {
      if (org.slug === target) {
        return org;
      }
    }
    return null;
  }

  public async findByShopId(shopId: string): Promise<Organization | null> {
    const target = shopId.toLowerCase();
    for (const org of this.items.values()) {
      if (org.uniqueShopId?.toLowerCase() === target) {
        return org;
      }
    }
    return null;
  }

  public async save(entity: Organization): Promise<Organization> {
    this.items.set(entity.id, entity);
    return entity;
  }

  public async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  public async find(options?: {
    filter?: { isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<Organization>> {
    let list = Array.from(this.items.values());

    if (options?.filter?.isActive !== undefined) {
      list = list.filter((o) => o.isActive === options.filter!.isActive);
    }
    if (options?.filter?.search) {
      const q = options.filter.search.toLowerCase();
      list = list.filter((o) => o.name.toLowerCase().includes(q) || o.slug.includes(q));
    }

    const pagination = options?.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public clear(): void {
    this.items.clear();
  }
}

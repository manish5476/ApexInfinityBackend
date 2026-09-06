import { Organization } from '../entities/Organization';
import { IRepository } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams } from '../../../../shared/pagination';

export interface IOrganizationRepository extends IRepository<Organization, string> {
  findBySlug(slug: string): Promise<Organization | null>;
  findByShopId(shopId: string): Promise<Organization | null>;
  find(options?: {
    filter?: { isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<Organization>>;
}

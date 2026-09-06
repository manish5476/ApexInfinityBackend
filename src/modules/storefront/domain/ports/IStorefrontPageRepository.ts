import { StorefrontPage } from '../entities/StorefrontPage';
import { PageType, PageStatus } from '../value-objects/StorefrontEnums';

export interface IStorefrontPageRepository {
  findById(query: { id: string; organizationId: string }): Promise<StorefrontPage | null>;
  findBySlug(query: { slug: string; organizationId: string }): Promise<StorefrontPage | null>;
  findHomepage(query: { organizationId: string }): Promise<StorefrontPage | null>;
  save(page: StorefrontPage): Promise<void>;
  list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    status?: PageStatus;
    pageType?: PageType;
    search?: string;
  }): Promise<{ data: StorefrontPage[]; total: number }>;
}

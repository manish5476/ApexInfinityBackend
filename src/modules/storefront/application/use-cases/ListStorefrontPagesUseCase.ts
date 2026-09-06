import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage } from '../../domain/entities/StorefrontPage';
import { PageStatus, PageType } from '../../domain/value-objects/StorefrontEnums';

export interface ListStorefrontPagesDto {
  page?: number;
  limit?: number;
  status?: PageStatus;
  pageType?: PageType;
  search?: string;
}

export class ListStorefrontPagesUseCase {
  constructor(private readonly pageRepo: IStorefrontPageRepository) {}

  async execute(dto: ListStorefrontPagesDto, context: { organizationId: string }): Promise<{ data: StorefrontPage[]; total: number }> {
    return this.pageRepo.list({
      organizationId: context.organizationId,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      status: dto.status,
      pageType: dto.pageType,
      search: dto.search,
    });
  }
}

import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage, PageSection, PageSeo } from '../../domain/entities/StorefrontPage';
import { PageType } from '../../domain/value-objects/StorefrontEnums';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { randomUUID } from 'crypto';

export interface CreateStorefrontPageDto {
  name: string;
  slug: string;
  pageType?: PageType;
  sections?: PageSection[];
  seo?: PageSeo;
  isHomepage?: boolean;
}

export class CreateStorefrontPageUseCase {
  constructor(
    private readonly pageRepo: IStorefrontPageRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(dto: CreateStorefrontPageDto, context: { organizationId: string }): Promise<StorefrontPage> {
    const existing = await this.pageRepo.findBySlug({
      slug: dto.slug.trim().toLowerCase(),
      organizationId: context.organizationId,
    });

    if (existing) {
      throw new Error(`Storefront page with slug '${dto.slug}' already exists`);
    }

    const page = StorefrontPage.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      ...dto,
    });

    await this.pageRepo.save(page);

    for (const event of page.domainEvents) {
      await this.eventBus.publishDomainEvent(event);
    }
    page.clearDomainEvents();

    return page;
  }
}

import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage } from '../../domain/entities/StorefrontPage';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';

export class PublishStorefrontPageUseCase {
  constructor(
    private readonly pageRepo: IStorefrontPageRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(params: { pageId: string }, context: { organizationId: string }): Promise<StorefrontPage> {
    const page = await this.pageRepo.findById({
      id: params.pageId,
      organizationId: context.organizationId,
    });

    if (!page) {
      throw new Error('Storefront page not found');
    }

    page.publish();
    await this.pageRepo.save(page);

    for (const event of page.domainEvents) {
      await this.eventBus.publishDomainEvent(event);
    }
    page.clearDomainEvents();

    return page;
  }
}

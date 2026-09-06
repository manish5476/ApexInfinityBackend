import { PublishStorefrontPageUseCase } from '../../../../src/modules/storefront/application/use-cases/PublishStorefrontPageUseCase';
import { InMemoryStorefrontPageRepository } from '../../../../src/modules/storefront/infrastructure/repositories/InMemoryStorefrontPageRepository';
import { StorefrontPage } from '../../../../src/modules/storefront/domain/entities/StorefrontPage';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';

describe('PublishStorefrontPageUseCase', () => {
  let pageRepo: InMemoryStorefrontPageRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let useCase: PublishStorefrontPageUseCase;

  beforeEach(() => {
    pageRepo = new InMemoryStorefrontPageRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    useCase = new PublishStorefrontPageUseCase(pageRepo, eventBus);
  });

  it('should publish draft page and emit event', async () => {
    const page = StorefrontPage.create({
      id: 'page-100',
      organizationId: 'org-test',
      name: 'FAQ',
      slug: 'faq',
    });
    await pageRepo.save(page);

    const published = await useCase.execute({ pageId: 'page-100' }, { organizationId: 'org-test' });

    expect(published.isPublished).toBe(true);
    expect(published.status).toBe('published');
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });

  it('should throw error if page not found', async () => {
    await expect(
      useCase.execute({ pageId: 'missing-page' }, { organizationId: 'org-test' })
    ).rejects.toThrow('Storefront page not found');
  });
});

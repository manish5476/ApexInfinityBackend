import { CreateStorefrontPageUseCase } from '../../../../src/modules/storefront/application/use-cases/CreateStorefrontPageUseCase';
import { InMemoryStorefrontPageRepository } from '../../../../src/modules/storefront/infrastructure/repositories/InMemoryStorefrontPageRepository';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { PageType } from '../../../../src/modules/storefront/domain/value-objects/StorefrontEnums';

describe('CreateStorefrontPageUseCase', () => {
  let pageRepo: InMemoryStorefrontPageRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let useCase: CreateStorefrontPageUseCase;

  beforeEach(() => {
    pageRepo = new InMemoryStorefrontPageRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    useCase = new CreateStorefrontPageUseCase(pageRepo, eventBus);
  });

  it('should create a storefront page and publish domain event', async () => {
    const page = await useCase.execute(
      {
        name: 'About Us',
        slug: 'about-us',
        pageType: PageType.ABOUT,
      },
      { organizationId: 'org-test' }
    );

    expect(page.id).toBeDefined();
    expect(page.name).toBe('About Us');
    expect(page.slug).toBe('about-us');
    expect(page.status).toBe('draft');
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });

  it('should reject duplicate slug within the same organization', async () => {
    await useCase.execute(
      {
        name: 'About Us 1',
        slug: 'about-us',
      },
      { organizationId: 'org-test' }
    );

    await expect(
      useCase.execute(
        {
          name: 'About Us 2',
          slug: 'about-us',
        },
        { organizationId: 'org-test' }
      )
    ).rejects.toThrow("Storefront page with slug 'about-us' already exists");
  });
});

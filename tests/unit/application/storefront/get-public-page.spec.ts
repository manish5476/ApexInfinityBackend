import { GetPublicPageBySlugUseCase } from '../../../../src/modules/storefront/application/use-cases/GetPublicPageBySlugUseCase';
import { InMemoryStorefrontPageRepository } from '../../../../src/modules/storefront/infrastructure/repositories/InMemoryStorefrontPageRepository';
import { StorefrontPage } from '../../../../src/modules/storefront/domain/entities/StorefrontPage';

describe('GetPublicPageBySlugUseCase', () => {
  let pageRepo: InMemoryStorefrontPageRepository;
  let useCase: GetPublicPageBySlugUseCase;

  beforeEach(() => {
    pageRepo = new InMemoryStorefrontPageRepository();
    useCase = new GetPublicPageBySlugUseCase(pageRepo);
  });

  it('should return null for draft (unpublished) page', async () => {
    const page = StorefrontPage.create({
      id: 'p-draft',
      organizationId: 'org-test',
      name: 'Secret Sale',
      slug: 'secret-sale',
    });
    await pageRepo.save(page);

    const result = await useCase.execute({ slug: 'secret-sale', organizationId: 'org-test' });
    expect(result).toBeNull();
  });

  it('should return published page and increment view count', async () => {
    const page = StorefrontPage.create({
      id: 'p-pub',
      organizationId: 'org-test',
      name: 'Public Catalog',
      slug: 'catalog',
    });
    page.publish();
    await pageRepo.save(page);

    const result1 = await useCase.execute({ slug: 'catalog', organizationId: 'org-test' });
    expect(result1).not.toBeNull();
    expect(result1?.viewCount).toBe(1);

    const result2 = await useCase.execute({ slug: 'catalog', organizationId: 'org-test' });
    expect(result2?.viewCount).toBe(2);
  });
});

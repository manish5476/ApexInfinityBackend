import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage } from '../../domain/entities/StorefrontPage';

export class GetPublicPageBySlugUseCase {
  constructor(private readonly pageRepo: IStorefrontPageRepository) {}

  async execute(params: { slug: string; organizationId: string }): Promise<StorefrontPage | null> {
    const page = await this.pageRepo.findBySlug({
      slug: params.slug.toLowerCase().trim(),
      organizationId: params.organizationId,
    });

    if (!page || !page.isPublished) {
      return null;
    }

    page.recordView();
    await this.pageRepo.save(page);

    return page;
  }
}

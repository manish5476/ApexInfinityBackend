import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage } from '../../domain/entities/StorefrontPage';
import { PageStatus, PageType } from '../../domain/value-objects/StorefrontEnums';

export class InMemoryStorefrontPageRepository implements IStorefrontPageRepository {
  public pages: StorefrontPage[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<StorefrontPage | null> {
    const p = this.pages.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return p ? StorefrontPage.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findBySlug(query: { slug: string; organizationId: string }): Promise<StorefrontPage | null> {
    const p = this.pages.find((x) => x.slug === query.slug.toLowerCase() && x.organizationId === query.organizationId);
    return p ? StorefrontPage.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findHomepage(query: { organizationId: string }): Promise<StorefrontPage | null> {
    const p = this.pages.find((x) => x.isHomepage && x.organizationId === query.organizationId);
    return p ? StorefrontPage.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async save(page: StorefrontPage): Promise<void> {
    // If setting homepage, unset any existing homepage for this org
    if (page.isHomepage) {
      for (const existing of this.pages) {
        if (existing.organizationId === page.organizationId && existing.id !== page.id && existing.isHomepage) {
          existing.unsetHomepage();
        }
      }
    }

    const idx = this.pages.findIndex((x) => x.id === page.id);
    if (idx >= 0) {
      this.pages[idx] = StorefrontPage.reconstitute({ ...page.props, id: page.id });
    } else {
      this.pages.push(StorefrontPage.reconstitute({ ...page.props, id: page.id }));
    }
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    status?: PageStatus;
    pageType?: PageType;
    search?: string;
  }): Promise<{ data: StorefrontPage[]; total: number }> {
    let filtered = this.pages.filter((p) => p.organizationId === query.organizationId);

    if (query.status) {
      filtered = filtered.filter((p) => p.status === query.status);
    }

    if (query.pageType) {
      filtered = filtered.filter((p) => p.pageType === query.pageType);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s));
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((p) => StorefrontPage.reconstitute({ ...p.props, id: p.id })),
      total: filtered.length,
    };
  }
}

import { IStorefrontPageRepository } from '../../domain/ports/IStorefrontPageRepository';
import { StorefrontPage } from '../../domain/entities/StorefrontPage';
import { PageStatus, PageType } from '../../domain/value-objects/StorefrontEnums';
import { StorefrontPageModel, IStorefrontPageDoc } from '../persistence/storefrontPage.model';

export class MongoStorefrontPageRepository implements IStorefrontPageRepository {
  private toEntity(doc: IStorefrontPageDoc): StorefrontPage {
    return StorefrontPage.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      name: doc.name,
      slug: doc.slug,
      pageType: doc.pageType as PageType,
      sections: (doc.sections || []).map((s: any) => ({
        id: s.id,
        type: s.type,
        order: s.order,
        data: s.data || {},
      })),
      seo: doc.seo
        ? {
            title: doc.seo.title,
            description: doc.seo.description,
            keywords: doc.seo.keywords,
            ogImage: doc.seo.ogImage,
            noIndex: doc.seo.noIndex,
          }
        : undefined,
      status: doc.status as PageStatus,
      isPublished: doc.isPublished,
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
      isHomepage: doc.isHomepage,
      viewCount: doc.viewCount || 0,
      lastViewedAt: doc.lastViewedAt ? new Date(doc.lastViewedAt) : null,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async findById(query: { id: string; organizationId: string }): Promise<StorefrontPage | null> {
    const doc = await StorefrontPageModel.findOne({
      _id: query.id,
      organizationId: query.organizationId,
    }).lean<IStorefrontPageDoc>();

    return doc ? this.toEntity(doc) : null;
  }

  async findBySlug(query: { slug: string; organizationId: string }): Promise<StorefrontPage | null> {
    const doc = await StorefrontPageModel.findOne({
      slug: query.slug.toLowerCase().trim(),
      organizationId: query.organizationId,
    }).lean<IStorefrontPageDoc>();

    return doc ? this.toEntity(doc) : null;
  }

  async findHomepage(query: { organizationId: string }): Promise<StorefrontPage | null> {
    const doc = await StorefrontPageModel.findOne({
      isHomepage: true,
      organizationId: query.organizationId,
    }).lean<IStorefrontPageDoc>();

    return doc ? this.toEntity(doc) : null;
  }

  async save(page: StorefrontPage): Promise<void> {
    const props = page.props;

    // If marking as homepage, unset previous homepage for this organization
    if (props.isHomepage) {
      await StorefrontPageModel.updateMany(
        {
          organizationId: props.organizationId,
          _id: { $ne: page.id },
          isHomepage: true,
        },
        { $set: { isHomepage: false } }
      );
    }

    await StorefrontPageModel.findByIdAndUpdate(
      page.id,
      {
        _id: page.id,
        organizationId: props.organizationId,
        name: props.name,
        slug: props.slug,
        pageType: props.pageType,
        sections: props.sections,
        seo: props.seo,
        status: props.status,
        isPublished: props.isPublished,
        publishedAt: props.publishedAt,
        isHomepage: props.isHomepage,
        viewCount: props.viewCount,
        lastViewedAt: props.lastViewedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    status?: PageStatus;
    pageType?: PageType;
    search?: string;
  }): Promise<{ data: StorefrontPage[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.pageType) {
      filter.pageType = query.pageType;
    }
    if (query.search) {
      const s = query.search.toLowerCase().trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { slug: { $regex: s, $options: 'i' } },
      ];
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.max(query.limit ?? 20, 1);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      StorefrontPageModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IStorefrontPageDoc[]>(),
      StorefrontPageModel.countDocuments(filter),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
    };
  }
}

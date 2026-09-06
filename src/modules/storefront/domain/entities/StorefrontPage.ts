import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { PageType, PageStatus } from '../value-objects/StorefrontEnums';
import { PageCreatedEvent } from '../events/PageCreatedEvent';
import { PagePublishedEvent } from '../events/PagePublishedEvent';

export interface PageSection {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

export interface StorefrontPageProps {
  organizationId: string;
  name: string;
  slug: string;
  pageType: PageType;
  sections: PageSection[];
  seo?: PageSeo;
  status: PageStatus;
  isPublished: boolean;
  publishedAt?: Date | null;
  isHomepage: boolean;
  viewCount: number;
  lastViewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStorefrontPageParams {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  pageType?: PageType;
  sections?: PageSection[];
  seo?: PageSeo;
  isHomepage?: boolean;
}

export class StorefrontPage extends AggregateRoot<string> {
  private _props: StorefrontPageProps;

  private constructor(id: string, props: StorefrontPageProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateStorefrontPageParams): StorefrontPage {
    const trimmedSlug = params.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      throw new Error('Slug may only contain lowercase letters, numbers, and hyphens');
    }

    if (!params.name.trim()) {
      throw new Error('Page name is required');
    }

    const now = new Date();
    const page = new StorefrontPage(params.id, {
      organizationId: params.organizationId,
      name: params.name.trim(),
      slug: trimmedSlug,
      pageType: params.pageType ?? PageType.CUSTOM,
      sections: params.sections ?? [],
      seo: params.seo,
      status: PageStatus.DRAFT,
      isPublished: false,
      publishedAt: null,
      isHomepage: params.isHomepage ?? false,
      viewCount: 0,
      lastViewedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    page.addDomainEvent(new PageCreatedEvent(page.id, page.organizationId, page.slug));
    return page;
  }

  static reconstitute(props: StorefrontPageProps & { id: string }): StorefrontPage {
    return new StorefrontPage(props.id, props);
  }

  publish(): void {
    this._props.status = PageStatus.PUBLISHED;
    this._props.isPublished = true;
    this._props.publishedAt = new Date();
    this._props.updatedAt = new Date();
    this.addDomainEvent(new PagePublishedEvent(this.id, this._props.organizationId, this._props.slug));
  }

  unpublish(): void {
    this._props.status = PageStatus.DRAFT;
    this._props.isPublished = false;
    this._props.updatedAt = new Date();
  }

  setAsHomepage(): void {
    this._props.isHomepage = true;
    this._props.updatedAt = new Date();
  }

  unsetHomepage(): void {
    this._props.isHomepage = false;
    this._props.updatedAt = new Date();
  }

  updateContent(name: string, sections: PageSection[], seo?: PageSeo): void {
    if (!name.trim()) throw new Error('Page name is required');
    this._props.name = name.trim();
    this._props.sections = sections;
    this._props.seo = seo;
    this._props.updatedAt = new Date();
  }

  recordView(): void {
    this._props.viewCount += 1;
    this._props.lastViewedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get name() { return this._props.name; }
  get slug() { return this._props.slug; }
  get pageType() { return this._props.pageType; }
  get sections() { return this._props.sections; }
  get seo() { return this._props.seo; }
  get status() { return this._props.status; }
  get isPublished() { return this._props.isPublished; }
  get isHomepage() { return this._props.isHomepage; }
  get viewCount() { return this._props.viewCount; }
  get props() { return { ...this._props }; }
}

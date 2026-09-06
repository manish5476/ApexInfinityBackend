import { StorefrontPage } from '../../../../src/modules/storefront/domain/entities/StorefrontPage';
import { PageStatus, PageType } from '../../../../src/modules/storefront/domain/value-objects/StorefrontEnums';
import { PageCreatedEvent } from '../../../../src/modules/storefront/domain/events/PageCreatedEvent';
import { PagePublishedEvent } from '../../../../src/modules/storefront/domain/events/PagePublishedEvent';

describe('StorefrontPage Aggregate Root', () => {
  const baseParams = {
    id: 'page-1',
    organizationId: 'org-1',
    name: 'Summer Sale 2026',
    slug: 'summer-sale-2026',
    pageType: PageType.LANDING,
    sections: [
      { id: 'sec-1', type: 'hero_banner', order: 0, data: { headline: 'Up to 50% Off' } },
    ],
  };

  it('should create a storefront page in DRAFT status and emit PageCreatedEvent', () => {
    const page = StorefrontPage.create(baseParams);

    expect(page.id).toBe('page-1');
    expect(page.name).toBe('Summer Sale 2026');
    expect(page.slug).toBe('summer-sale-2026');
    expect(page.pageType).toBe(PageType.LANDING);
    expect(page.status).toBe(PageStatus.DRAFT);
    expect(page.isPublished).toBe(false);
    expect(page.viewCount).toBe(0);

    expect(page.domainEvents).toHaveLength(1);
    expect(page.domainEvents[0]).toBeInstanceOf(PageCreatedEvent);
  });

  it('should reject invalid slugs', () => {
    expect(() =>
      StorefrontPage.create({
        ...baseParams,
        slug: 'Summer Sale!',
      })
    ).toThrow('Slug may only contain lowercase letters, numbers, and hyphens');
  });

  it('should publish page and emit PagePublishedEvent', () => {
    const page = StorefrontPage.create(baseParams);
    page.clearDomainEvents();

    page.publish();
    expect(page.status).toBe(PageStatus.PUBLISHED);
    expect(page.isPublished).toBe(true);
    expect(page.domainEvents).toHaveLength(1);
    expect(page.domainEvents[0]).toBeInstanceOf(PagePublishedEvent);
  });

  it('should unpublish page back to DRAFT', () => {
    const page = StorefrontPage.create(baseParams);
    page.publish();
    page.unpublish();

    expect(page.status).toBe(PageStatus.DRAFT);
    expect(page.isPublished).toBe(false);
  });

  it('should track view count', () => {
    const page = StorefrontPage.create(baseParams);
    expect(page.viewCount).toBe(0);

    page.recordView();
    expect(page.viewCount).toBe(1);

    page.recordView();
    expect(page.viewCount).toBe(2);
  });

  it('should manage homepage flag', () => {
    const page = StorefrontPage.create(baseParams);
    expect(page.isHomepage).toBe(false);

    page.setAsHomepage();
    expect(page.isHomepage).toBe(true);

    page.unsetHomepage();
    expect(page.isHomepage).toBe(false);
  });
});

import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class PagePublishedEvent implements IDomainEvent<any> {
  public readonly eventName = 'PagePublishedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { pageId: string; organizationId: string; slug: string };

  constructor(pageId: string, organizationId: string, slug: string) {
    this.aggregateId = pageId;
    this.occurredOn = new Date();
    this.payload = { pageId, organizationId, slug };
  }
}

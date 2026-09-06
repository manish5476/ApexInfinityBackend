import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export interface OrganizationCreatedPayload {
  organizationId: string;
  name: string;
  slug: string;
}

export class OrganizationCreatedEvent implements IDomainEvent<OrganizationCreatedPayload> {
  public readonly eventName = 'organization.created';
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly payload: OrganizationCreatedPayload;

  constructor(organizationId: string, name: string, slug: string) {
    this.occurredOn = new Date();
    this.aggregateId = organizationId;
    this.payload = { organizationId, name, slug };
    Object.freeze(this);
  }
}

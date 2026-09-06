import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class LeadConvertedEvent implements IDomainEvent<any> {
  public readonly eventName = 'LeadConvertedEvent';
  public readonly payload: { leadId: string; organizationId: string; customerId?: string };
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(leadId: string, organizationId: string, customerId?: string) {
    this.aggregateId = leadId;
    this.payload = { leadId, organizationId, customerId };
    this.occurredOn = new Date();
  }
}

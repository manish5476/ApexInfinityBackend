import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class OpportunityWonEvent implements IDomainEvent<any> {
  public readonly eventName = 'OpportunityWonEvent';
  public readonly payload: { opportunityId: string; organizationId: string; amount: number };
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(opportunityId: string, organizationId: string, amount: number) {
    this.aggregateId = opportunityId;
    this.payload = { opportunityId, organizationId, amount };
    this.occurredOn = new Date();
  }
}

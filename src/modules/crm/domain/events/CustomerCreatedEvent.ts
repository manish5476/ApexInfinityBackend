import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class CustomerCreatedEvent implements IDomainEvent<any> {
  public readonly eventName = 'CustomerCreatedEvent';
  public readonly payload: { customerId: string; organizationId: string };
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(customerId: string, organizationId: string) {
    this.aggregateId = customerId;
    this.payload = { customerId, organizationId };
    this.occurredOn = new Date();
  }
}

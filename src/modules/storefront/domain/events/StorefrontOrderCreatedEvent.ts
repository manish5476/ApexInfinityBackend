import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class StorefrontOrderCreatedEvent implements IDomainEvent<any> {
  public readonly eventName = 'StorefrontOrderCreatedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { orderId: string; organizationId: string; orderNumber: string; grandTotal: number };

  constructor(orderId: string, organizationId: string, orderNumber: string, grandTotal: number) {
    this.aggregateId = orderId;
    this.occurredOn = new Date();
    this.payload = { orderId, organizationId, orderNumber, grandTotal };
  }
}

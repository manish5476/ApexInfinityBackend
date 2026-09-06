import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class ProductCreatedEvent implements IDomainEvent<any> {
  public readonly eventName = 'ProductCreatedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { productId: string; organizationId: string };
  constructor(productId: string, organizationId: string) {
    this.aggregateId = productId;
    this.occurredOn = new Date();
    this.payload = { productId, organizationId };
  }
}

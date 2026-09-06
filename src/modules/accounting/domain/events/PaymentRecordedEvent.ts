import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class PaymentRecordedEvent implements IDomainEvent<any> {
  public readonly eventName = 'PaymentRecordedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { paymentId: string; organizationId: string; amount: number; type: string };
  constructor(paymentId: string, organizationId: string, amount: number, type: string) {
    this.aggregateId = paymentId;
    this.occurredOn = new Date();
    this.payload = { paymentId, organizationId, amount, type };
  }
}

import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class InvoiceCreatedEvent implements IDomainEvent<any> {
  public readonly eventName = 'InvoiceCreatedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { invoiceId: string; organizationId: string; grandTotal: number };
  constructor(invoiceId: string, organizationId: string, grandTotal: number) {
    this.aggregateId = invoiceId;
    this.occurredOn = new Date();
    this.payload = { invoiceId, organizationId, grandTotal };
  }
}

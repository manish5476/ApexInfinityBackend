import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export interface StockReceivedItem {
  productId: string;
  quantity: number;
}

export class StockReceivedEvent implements IDomainEvent<any> {
  public readonly eventName = 'StockReceivedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { purchaseOrderId: string; organizationId: string; branchId: string; items: StockReceivedItem[] };
  constructor(purchaseOrderId: string, organizationId: string, branchId: string, items: StockReceivedItem[]) {
    this.aggregateId = purchaseOrderId;
    this.occurredOn = new Date();
    this.payload = { purchaseOrderId, organizationId, branchId, items };
  }
}

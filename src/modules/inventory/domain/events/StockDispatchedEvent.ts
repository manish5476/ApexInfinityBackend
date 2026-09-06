import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export interface StockDispatchedItem {
  productId: string;
  quantity: number;
}

export class StockDispatchedEvent implements IDomainEvent<any> {
  public readonly eventName = 'StockDispatchedEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { salesOrderId: string; organizationId: string; branchId: string; items: StockDispatchedItem[] };
  constructor(salesOrderId: string, organizationId: string, branchId: string, items: StockDispatchedItem[]) {
    this.aggregateId = salesOrderId;
    this.occurredOn = new Date();
    this.payload = { salesOrderId, organizationId, branchId, items };
  }
}

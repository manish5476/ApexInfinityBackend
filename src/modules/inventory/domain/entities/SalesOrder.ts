import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { OrderStatus, PaymentStatus } from '../value-objects/InventoryEnums';
import { StockDispatchedEvent } from '../events/StockDispatchedEvent';

export interface SalesOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
  discount: number;
}

export interface SalesOrderProps {
  organizationId: string;
  branchId: string;
  customerId?: string | null;
  invoiceId?: string | null;
  status: OrderStatus;
  items: SalesOrderItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  balanceAmount: number;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesOrderParams {
  id: string;
  organizationId: string;
  branchId: string;
  customerId?: string | null;
  items: SalesOrderItem[];
  notes?: string | null;
  createdBy?: string | null;
}

function calcTotals(items: SalesOrderItem[]) {
  let subTotal = 0, totalTax = 0, totalDiscount = 0;
  for (const item of items) {
    const lineTotal = item.price * item.quantity;
    const lineDiscount = item.discount || 0;
    const taxableBase = lineTotal - lineDiscount;
    subTotal += lineTotal;
    totalDiscount += lineDiscount;
    totalTax += ((item.taxRate || 0) / 100) * taxableBase;
  }
  const grandTotal = parseFloat((subTotal - totalDiscount + totalTax).toFixed(2));
  return { subTotal: parseFloat(subTotal.toFixed(2)), totalTax: parseFloat(totalTax.toFixed(2)), totalDiscount: parseFloat(totalDiscount.toFixed(2)), grandTotal };
}

export class SalesOrder extends AggregateRoot<string> {
  private _props: SalesOrderProps;

  private constructor(id: string, props: SalesOrderProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateSalesOrderParams): SalesOrder {
    if (!params.items.length) throw new Error('Sales order must have at least one item');
    const now = new Date();
    const { subTotal, totalTax, totalDiscount, grandTotal } = calcTotals(params.items);
    return new SalesOrder(params.id, {
      organizationId: params.organizationId,
      branchId: params.branchId,
      customerId: params.customerId ?? null,
      invoiceId: null,
      status: OrderStatus.DRAFT,
      items: params.items,
      subTotal,
      totalTax,
      totalDiscount,
      grandTotal,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceAmount: grandTotal,
      notes: params.notes ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SalesOrderProps & { id: string }): SalesOrder {
    return new SalesOrder(props.id, props);
  }

  dispatch(): void {
    if (this._props.status === OrderStatus.CANCELLED) throw new Error('Cannot dispatch a cancelled sales order');
    if (this._props.status === OrderStatus.FULFILLED) throw new Error('Sales order already fulfilled');
    this._props.status = OrderStatus.FULFILLED;
    this._props.updatedAt = new Date();
    this.addDomainEvent(new StockDispatchedEvent(this.id, this._props.organizationId, this._props.branchId, this._props.items));
  }

  cancel(): void {
    if (this._props.status === OrderStatus.FULFILLED) throw new Error('Cannot cancel a fulfilled sales order');
    this._props.status = OrderStatus.CANCELLED;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get branchId() { return this._props.branchId; }
  get status() { return this._props.status; }
  get items() { return this._props.items; }
  get grandTotal() { return this._props.grandTotal; }
  get props() { return { ...this._props }; }
}

import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { OrderStatus, PaymentStatus } from '../value-objects/InventoryEnums';
import { StockReceivedEvent } from '../events/StockReceivedEvent';

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
  discount: number;
}

export interface PurchaseOrderProps {
  organizationId: string;
  branchId: string;
  supplierId: string;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  purchaseDate: Date;
  dueDate?: Date | null;
  status: OrderStatus;
  items: PurchaseOrderItem[];
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

export interface CreatePurchaseOrderParams {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  dueDate?: Date | null;
  items: Omit<PurchaseOrderItem, never>[];
  notes?: string | null;
  createdBy?: string | null;
}

function calcTotals(items: PurchaseOrderItem[]) {
  let subTotal = 0, totalTax = 0, totalDiscount = 0;
  for (const item of items) {
    const lineTotal = item.purchasePrice * item.quantity;
    const lineDiscount = item.discount || 0;
    const taxableBase = lineTotal - lineDiscount;
    subTotal += lineTotal;
    totalDiscount += lineDiscount;
    totalTax += ((item.taxRate || 0) / 100) * taxableBase;
  }
  const grandTotal = parseFloat((subTotal - totalDiscount + totalTax).toFixed(2));
  return { subTotal: parseFloat(subTotal.toFixed(2)), totalTax: parseFloat(totalTax.toFixed(2)), totalDiscount: parseFloat(totalDiscount.toFixed(2)), grandTotal };
}

export class PurchaseOrder extends AggregateRoot<string> {
  private _props: PurchaseOrderProps;

  private constructor(id: string, props: PurchaseOrderProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreatePurchaseOrderParams): PurchaseOrder {
    if (!params.items.length) throw new Error('Purchase order must have at least one item');
    const now = new Date();
    const { subTotal, totalTax, totalDiscount, grandTotal } = calcTotals(params.items);
    return new PurchaseOrder(params.id, {
      organizationId: params.organizationId,
      branchId: params.branchId,
      supplierId: params.supplierId,
      supplierName: params.supplierName ?? null,
      invoiceNumber: params.invoiceNumber ?? null,
      purchaseDate: now,
      dueDate: params.dueDate ?? null,
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

  static reconstitute(props: PurchaseOrderProps & { id: string }): PurchaseOrder {
    return new PurchaseOrder(props.id, props);
  }

  receive(): void {
    if (this._props.status === OrderStatus.CANCELLED) throw new Error('Cannot receive a cancelled purchase order');
    if (this._props.status === OrderStatus.RECEIVED) throw new Error('Purchase order already received');
    this._props.status = OrderStatus.RECEIVED;
    this._props.updatedAt = new Date();
    this.addDomainEvent(new StockReceivedEvent(this.id, this._props.organizationId, this._props.branchId, this._props.items));
  }

  cancel(): void {
    if (this._props.status === OrderStatus.RECEIVED) throw new Error('Cannot cancel a received purchase order');
    this._props.status = OrderStatus.CANCELLED;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get branchId() { return this._props.branchId; }
  get supplierId() { return this._props.supplierId; }
  get status() { return this._props.status; }
  get items() { return this._props.items; }
  get grandTotal() { return this._props.grandTotal; }
  get paymentStatus() { return this._props.paymentStatus; }
  get props() { return { ...this._props }; }
}

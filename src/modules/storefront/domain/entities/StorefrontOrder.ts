import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { StorefrontOrderStatus } from '../value-objects/StorefrontEnums';
import { StorefrontOrderCreatedEvent } from '../events/StorefrontOrderCreatedEvent';

export interface StorefrontOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StorefrontShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface StorefrontOrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

export interface StorefrontOrderProps {
  organizationId: string;
  orderNumber: string;
  customerId?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  items: StorefrontOrderItem[];
  shippingAddress: StorefrontShippingAddress;
  totals: StorefrontOrderTotals;
  status: StorefrontOrderStatus;
  paymentStatus: 'unpaid' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStorefrontOrderParams {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  items: StorefrontOrderItem[];
  shippingAddress: StorefrontShippingAddress;
  shippingFee?: number;
  discount?: number;
  tax?: number;
}

export class StorefrontOrder extends AggregateRoot<string> {
  private _props: StorefrontOrderProps;

  private constructor(id: string, props: StorefrontOrderProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateStorefrontOrderParams): StorefrontOrder {
    if (!params.items || params.items.length === 0) {
      throw new Error('Storefront order must contain at least one item');
    }

    const subtotal = params.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = params.discount ?? 0;
    const shipping = params.shippingFee ?? 0;
    const tax = params.tax ?? 0;
    const grandTotal = parseFloat((subtotal - discount + shipping + tax).toFixed(2));

    if (grandTotal < 0) {
      throw new Error('Grand total cannot be negative');
    }

    const now = new Date();
    const order = new StorefrontOrder(params.id, {
      organizationId: params.organizationId,
      orderNumber: params.orderNumber.toUpperCase(),
      customerId: params.customerId ?? null,
      customerEmail: params.customerEmail.trim().toLowerCase(),
      customerPhone: params.customerPhone ?? null,
      items: params.items,
      shippingAddress: params.shippingAddress,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        grandTotal,
      },
      status: StorefrontOrderStatus.PENDING,
      paymentStatus: 'unpaid',
      createdAt: now,
      updatedAt: now,
    });

    order.addDomainEvent(new StorefrontOrderCreatedEvent(order.id, order.organizationId, order.orderNumber, grandTotal));
    return order;
  }

  static reconstitute(props: StorefrontOrderProps & { id: string }): StorefrontOrder {
    return new StorefrontOrder(props.id, props);
  }

  confirm(): void {
    if (this._props.status !== StorefrontOrderStatus.PENDING) {
      throw new Error(`Cannot confirm order from status ${this._props.status}`);
    }
    this._props.status = StorefrontOrderStatus.CONFIRMED;
    this._props.updatedAt = new Date();
  }

  cancel(): void {
    if (this._props.status === StorefrontOrderStatus.DELIVERED) {
      throw new Error('Cannot cancel an already delivered order');
    }
    this._props.status = StorefrontOrderStatus.CANCELLED;
    this._props.updatedAt = new Date();
  }

  markPaid(): void {
    this._props.paymentStatus = 'paid';
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get orderNumber() { return this._props.orderNumber; }
  get customerEmail() { return this._props.customerEmail; }
  get items() { return this._props.items; }
  get totals() { return this._props.totals; }
  get status() { return this._props.status; }
  get paymentStatus() { return this._props.paymentStatus; }
  get props() { return { ...this._props }; }
}

import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { InvoiceStatus, PaymentMethod } from '../value-objects/AccountingEnums';
import { InvoiceCreatedEvent } from '../events/InvoiceCreatedEvent';

export interface InvoiceLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  taxRate: number;
  hsnCode?: string | null;
}

export interface InvoiceProps {
  organizationId: string;
  branchId?: string | null;
  customerId?: string | null;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  status: InvoiceStatus;
  source: 'crm' | 'storefront' | 'pos';
  items: InvoiceLineItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  isDeleted?: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceParams {
  id: string;
  organizationId: string;
  branchId?: string | null;
  customerId?: string | null;
  invoiceNumber: string;
  dueDate?: Date | null;
  source?: 'crm' | 'storefront' | 'pos';
  items: InvoiceLineItem[];
  shippingCharges?: number;
  roundOff?: number;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  createdBy?: string | null;
}

function calcTotals(items: InvoiceLineItem[], shippingCharges: number, roundOff: number) {
  let subTotal = 0, totalTax = 0, totalDiscount = 0;
  for (const item of items) {
    const lineTotal = item.price * item.quantity;
    const lineDiscount = item.discount || 0;
    const taxableBase = lineTotal - lineDiscount;
    subTotal += lineTotal;
    totalDiscount += lineDiscount;
    totalTax += ((item.taxRate || 0) / 100) * taxableBase;
  }
  const grandTotal = parseFloat((subTotal - totalDiscount + totalTax + shippingCharges + roundOff).toFixed(2));
  if (grandTotal < 0) throw new Error('Grand total cannot be negative. Check discounts and prices.');
  return {
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    grandTotal,
  };
}

export class Invoice extends AggregateRoot<string> {
  private _props: InvoiceProps;

  private constructor(id: string, props: InvoiceProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateInvoiceParams): Invoice {
    if (!params.items.length) throw new Error('Invoice must have at least one line item');
    const now = new Date();
    const shipping = params.shippingCharges ?? 0;
    const roundOff = params.roundOff ?? 0;
    const { subTotal, totalTax, totalDiscount, grandTotal } = calcTotals(params.items, shipping, roundOff);

    const invoice = new Invoice(params.id, {
      organizationId: params.organizationId,
      branchId: params.branchId ?? null,
      customerId: params.customerId ?? null,
      invoiceNumber: params.invoiceNumber.toUpperCase(),
      invoiceDate: now,
      dueDate: params.dueDate ?? null,
      status: InvoiceStatus.ISSUED,
      source: params.source ?? 'crm',
      items: params.items,
      subTotal,
      totalTax,
      totalDiscount,
      shippingCharges: shipping,
      roundOff,
      grandTotal,
      paymentStatus: 'unpaid',
      paidAmount: 0,
      balanceAmount: grandTotal,
      paymentMethod: params.paymentMethod ?? PaymentMethod.CASH,
      notes: params.notes ?? null,
      billingAddress: params.billingAddress ?? null,
      shippingAddress: params.shippingAddress ?? null,
      isDeleted: false,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    });

    invoice.addDomainEvent(new InvoiceCreatedEvent(params.id, params.organizationId, grandTotal));
    return invoice;
  }

  static reconstitute(props: InvoiceProps & { id: string }): Invoice {
    return new Invoice(props.id, props);
  }

  recordPayment(amount: number): void {
    if (amount <= 0) throw new Error('Payment amount must be positive');
    if (amount > this._props.balanceAmount) throw new Error('Payment exceeds outstanding balance');
    this._props.paidAmount = parseFloat((this._props.paidAmount + amount).toFixed(2));
    this._props.balanceAmount = parseFloat((this._props.grandTotal - this._props.paidAmount).toFixed(2));
    if (this._props.balanceAmount <= 0) {
      this._props.paymentStatus = 'paid';
      this._props.status = InvoiceStatus.PAID;
    } else {
      this._props.paymentStatus = 'partial';
    }
    this._props.updatedAt = new Date();
  }

  updateDetails(params: {
    dueDate?: Date | null;
    notes?: string | null;
    billingAddress?: string | null;
    shippingAddress?: string | null;
    paymentMethod?: PaymentMethod;
  }): void {
    if (params.dueDate !== undefined) this._props.dueDate = params.dueDate;
    if (params.notes !== undefined) this._props.notes = params.notes;
    if (params.billingAddress !== undefined) this._props.billingAddress = params.billingAddress;
    if (params.shippingAddress !== undefined) this._props.shippingAddress = params.shippingAddress;
    if (params.paymentMethod !== undefined) this._props.paymentMethod = params.paymentMethod;
    this._props.updatedAt = new Date();
  }

  cancel(): void {
    if (this._props.status === InvoiceStatus.PAID) throw new Error('Cannot cancel a fully paid invoice');
    this._props.status = InvoiceStatus.CANCELLED;
    this._props.updatedAt = new Date();
  }

  softDelete(): void {
    this._props.isDeleted = true;
    this._props.updatedAt = new Date();
  }

  restore(): void {
    this._props.isDeleted = false;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get branchId() { return this._props.branchId; }
  get customerId() { return this._props.customerId; }
  get invoiceNumber() { return this._props.invoiceNumber; }
  get status() { return this._props.status; }
  get grandTotal() { return this._props.grandTotal; }
  get balanceAmount() { return this._props.balanceAmount; }
  get paidAmount() { return this._props.paidAmount; }
  get paymentStatus() { return this._props.paymentStatus; }
  get items() { return this._props.items; }
  get isDeleted() { return this._props.isDeleted ?? false; }
  get props() { return { ...this._props }; }
}

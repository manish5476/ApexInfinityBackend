import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { PaymentMethod, PaymentType, AllocationStatus } from '../value-objects/AccountingEnums';
import { PaymentRecordedEvent } from '../events/PaymentRecordedEvent';

export interface PaymentAllocation {
  type: 'invoice' | 'advance' | 'purchase' | 'other';
  documentId: string;
  amount: number;
  allocatedAt: Date;
}

export interface PaymentProps {
  organizationId: string;
  branchId?: string | null;
  type: PaymentType;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  paymentDate: Date;
  referenceNumber?: string | null;
  amount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  allocationStatus: AllocationStatus;
  allocatedTo: PaymentAllocation[];
  isDeleted?: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentParams {
  id: string;
  organizationId: string;
  branchId?: string | null;
  type: PaymentType;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  transactionId?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  createdBy?: string | null;
}

export class Payment extends AggregateRoot<string> {
  private _props: PaymentProps;

  private constructor(id: string, props: PaymentProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreatePaymentParams): Payment {
    if (params.amount <= 0) throw new Error('Payment amount must be greater than zero');
    const now = new Date();
    const payment = new Payment(params.id, {
      organizationId: params.organizationId,
      branchId: params.branchId ?? null,
      type: params.type,
      customerId: params.customerId ?? null,
      supplierId: params.supplierId ?? null,
      invoiceId: params.invoiceId ?? null,
      purchaseId: params.purchaseId ?? null,
      paymentDate: now,
      referenceNumber: params.referenceNumber ?? null,
      amount: params.amount,
      remainingAmount: params.amount,
      paymentMethod: params.paymentMethod ?? PaymentMethod.CASH,
      transactionId: params.transactionId ?? null,
      bankName: params.bankName ?? null,
      remarks: params.remarks ?? null,
      status: 'completed',
      allocationStatus: AllocationStatus.UNALLOCATED,
      allocatedTo: [],
      isDeleted: false,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    });
    payment.addDomainEvent(new PaymentRecordedEvent(params.id, params.organizationId, params.amount, params.type));
    return payment;
  }

  static reconstitute(props: PaymentProps & { id: string }): Payment {
    return new Payment(props.id, props);
  }

  allocate(allocation: { type: 'invoice' | 'advance' | 'purchase' | 'other'; documentId: string; amount: number }): void {
    if (allocation.amount <= 0) throw new Error('Allocation amount must be greater than zero');
    if (allocation.amount > this._props.remainingAmount) {
      throw new Error(`Allocation amount (${allocation.amount}) exceeds remaining unallocated amount (${this._props.remainingAmount})`);
    }

    this._props.allocatedTo.push({
      ...allocation,
      allocatedAt: new Date(),
    });

    this._props.remainingAmount = parseFloat((this._props.remainingAmount - allocation.amount).toFixed(2));
    if (this._props.remainingAmount === 0) {
      this._props.allocationStatus = AllocationStatus.FULLY_ALLOCATED;
    } else {
      this._props.allocationStatus = AllocationStatus.PARTIALLY_ALLOCATED;
    }
    this._props.updatedAt = new Date();
  }

  cancel(): void {
    this._props.status = 'cancelled';
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
  get supplierId() { return this._props.supplierId; }
  get amount() { return this._props.amount; }
  get remainingAmount() { return this._props.remainingAmount; }
  get type() { return this._props.type; }
  get invoiceId() { return this._props.invoiceId; }
  get status() { return this._props.status; }
  get allocationStatus() { return this._props.allocationStatus; }
  get allocatedTo() { return [...this._props.allocatedTo]; }
  get isDeleted() { return this._props.isDeleted ?? false; }
  get props() { return { ...this._props }; }
}

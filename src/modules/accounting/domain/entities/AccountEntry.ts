import { AggregateRoot } from '../../../../core/domain/AggregateRoot';

export interface AccountEntryProps {
  organizationId: string;
  branchId?: string | null;
  accountId: string;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  paymentId?: string | null;
  date: Date;
  debit: number;
  credit: number;
  description?: string | null;
  referenceNumber?: string | null;
  referenceType?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountEntryParams {
  id: string;
  organizationId: string;
  branchId?: string | null;
  accountId: string;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  paymentId?: string | null;
  date?: Date;
  debit?: number;
  credit?: number;
  description?: string | null;
  referenceNumber?: string | null;
  referenceType?: string | null;
  createdBy?: string | null;
}

export class AccountEntry extends AggregateRoot<string> {
  private _props: AccountEntryProps;

  private constructor(id: string, props: AccountEntryProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateAccountEntryParams): AccountEntry {
    const debit = Math.round((params.debit || 0) * 100) / 100;
    const credit = Math.round((params.credit || 0) * 100) / 100;

    if (debit === 0 && credit === 0) {
      throw new Error('AccountEntry must have a non-zero debit or credit value');
    }
    if (debit > 0 && credit > 0) {
      throw new Error(`AccountEntry cannot be both debit (${debit}) and credit (${credit}) simultaneously`);
    }

    const now = new Date();
    return new AccountEntry(params.id, {
      organizationId: params.organizationId,
      branchId: params.branchId ?? null,
      accountId: params.accountId,
      customerId: params.customerId ?? null,
      supplierId: params.supplierId ?? null,
      invoiceId: params.invoiceId ?? null,
      purchaseId: params.purchaseId ?? null,
      paymentId: params.paymentId ?? null,
      date: params.date ?? now,
      debit,
      credit,
      description: params.description ?? null,
      referenceNumber: params.referenceNumber ? params.referenceNumber.trim().toUpperCase() : null,
      referenceType: params.referenceType ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AccountEntryProps & { id: string }): AccountEntry {
    return new AccountEntry(props.id, props);
  }

  get organizationId() { return this._props.organizationId; }
  get branchId() { return this._props.branchId; }
  get accountId() { return this._props.accountId; }
  get customerId() { return this._props.customerId; }
  get supplierId() { return this._props.supplierId; }
  get invoiceId() { return this._props.invoiceId; }
  get paymentId() { return this._props.paymentId; }
  get date() { return this._props.date; }
  get debit() { return this._props.debit; }
  get credit() { return this._props.credit; }
  get description() { return this._props.description; }
  get referenceNumber() { return this._props.referenceNumber; }
  get referenceType() { return this._props.referenceType; }
  get props() { return { ...this._props }; }
}

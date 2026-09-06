import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { CustomerStatus } from '../value-objects/CustomerStatus';
import { CustomerCreatedEvent } from '../events/CustomerCreatedEvent';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface GuarantorEntry {
  customerId: string;
  notes?: string | null;
  addedAt: Date;
  addedBy?: string | null;
}

export type CustomerType = 'individual' | 'business';

export interface CustomerProps {
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  type?: CustomerType;
  contactPerson?: string | null;
  avatar?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  billingAddress?: Address | null;
  shippingAddress?: Address | null;
  openingBalance?: number;
  outstandingBalance?: number;
  creditLimit?: number;
  paymentTerms?: string | null;
  notes?: string | null;
  tags?: string[];
  guarantors?: GuarantorEntry[];
  status: CustomerStatus;
  isActive: boolean;
  isDeleted: boolean;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCustomerDetailsParams {
  name?: string;
  email?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  type?: CustomerType;
  contactPerson?: string | null;
  avatar?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  billingAddress?: Address | null;
  shippingAddress?: Address | null;
  paymentTerms?: string | null;
  notes?: string | null;
  tags?: string[];
  ownerId?: string | null;
}

export class Customer extends AggregateRoot<string> {
  private _organizationId: string;
  private _name: string;
  private _email: string | null;
  private _phone: string | null;
  private _altPhone: string | null;
  private _type: CustomerType;
  private _contactPerson: string | null;
  private _avatar: string | null;
  private _gstNumber: string | null;
  private _panNumber: string | null;
  private _billingAddress: Address | null;
  private _shippingAddress: Address | null;
  private _openingBalance: number;
  private _outstandingBalance: number;
  private _creditLimit: number;
  private _paymentTerms: string | null;
  private _notes: string | null;
  private _tags: string[];
  private _guarantors: GuarantorEntry[];
  private _status: CustomerStatus;
  private _isActive: boolean;
  private _isDeleted: boolean;
  private _ownerId: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: CustomerProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._email = props.email ?? null;
    this._phone = props.phone ?? null;
    this._altPhone = props.altPhone ?? null;
    this._type = props.type ?? 'individual';
    this._contactPerson = props.contactPerson ?? null;
    this._avatar = props.avatar ?? null;
    this._gstNumber = props.gstNumber ?? null;
    this._panNumber = props.panNumber ?? null;
    this._billingAddress = props.billingAddress ?? null;
    this._shippingAddress = props.shippingAddress ?? null;
    this._openingBalance = props.openingBalance ?? 0;
    this._outstandingBalance = props.outstandingBalance ?? 0;
    this._creditLimit = props.creditLimit ?? 0;
    this._paymentTerms = props.paymentTerms ?? null;
    this._notes = props.notes ?? null;
    this._tags = props.tags ?? [];
    this._guarantors = props.guarantors ?? [];
    this._status = props.status;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this._ownerId = props.ownerId ?? null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get organizationId(): string { return this._organizationId; }
  get name(): string { return this._name; }
  get email(): string | null { return this._email; }
  get phone(): string | null { return this._phone; }
  get altPhone(): string | null { return this._altPhone; }
  get type(): CustomerType { return this._type; }
  get contactPerson(): string | null { return this._contactPerson; }
  get avatar(): string | null { return this._avatar; }
  get gstNumber(): string | null { return this._gstNumber; }
  get panNumber(): string | null { return this._panNumber; }
  get billingAddress(): Address | null { return this._billingAddress; }
  get shippingAddress(): Address | null { return this._shippingAddress; }
  get openingBalance(): number { return this._openingBalance; }
  get outstandingBalance(): number { return this._outstandingBalance; }
  get creditLimit(): number { return this._creditLimit; }
  get paymentTerms(): string | null { return this._paymentTerms; }
  get notes(): string | null { return this._notes; }
  get tags(): string[] { return [...this._tags]; }
  get guarantors(): GuarantorEntry[] { return [...this._guarantors]; }
  get status(): CustomerStatus { return this._status; }
  get isActive(): boolean { return this._isActive; }
  get isDeleted(): boolean { return this._isDeleted; }
  get ownerId(): string | null { return this._ownerId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public get props(): CustomerProps {
    return {
      organizationId: this._organizationId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      altPhone: this._altPhone,
      type: this._type,
      contactPerson: this._contactPerson,
      avatar: this._avatar,
      gstNumber: this._gstNumber,
      panNumber: this._panNumber,
      billingAddress: this._billingAddress,
      shippingAddress: this._shippingAddress,
      openingBalance: this._openingBalance,
      outstandingBalance: this._outstandingBalance,
      creditLimit: this._creditLimit,
      paymentTerms: this._paymentTerms,
      notes: this._notes,
      tags: [...this._tags],
      guarantors: [...this._guarantors],
      status: this._status,
      isActive: this._isActive,
      isDeleted: this._isDeleted,
      ownerId: this._ownerId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public updateDetails(params: UpdateCustomerDetailsParams): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Customer name cannot be empty');
      this._name = params.name.trim();
    }
    if (params.email !== undefined) this._email = params.email ? params.email.trim().toLowerCase() : null;
    if (params.phone !== undefined) this._phone = params.phone ? params.phone.trim() : null;
    if (params.altPhone !== undefined) this._altPhone = params.altPhone ? params.altPhone.trim() : null;
    if (params.type !== undefined) this._type = params.type;
    if (params.contactPerson !== undefined) this._contactPerson = params.contactPerson ? params.contactPerson.trim() : null;
    if (params.avatar !== undefined) this._avatar = params.avatar;
    if (params.gstNumber !== undefined) this._gstNumber = params.gstNumber ? params.gstNumber.trim().toUpperCase() : null;
    if (params.panNumber !== undefined) this._panNumber = params.panNumber ? params.panNumber.trim().toUpperCase() : null;
    if (params.billingAddress !== undefined) this._billingAddress = params.billingAddress;
    if (params.shippingAddress !== undefined) this._shippingAddress = params.shippingAddress;
    if (params.paymentTerms !== undefined) this._paymentTerms = params.paymentTerms ? params.paymentTerms.trim() : null;
    if (params.notes !== undefined) this._notes = params.notes ? params.notes.trim() : null;
    if (params.tags !== undefined) this._tags = params.tags.filter(t => t && t.trim().length > 0).map(t => t.trim());
    if (params.ownerId !== undefined) this._ownerId = params.ownerId;

    this._updatedAt = new Date();
  }

  public updateCreditLimit(creditLimit: number): void {
    if (creditLimit < 0) {
      throw new Error('Credit limit cannot be negative');
    }
    this._creditLimit = creditLimit;
    this._updatedAt = new Date();
  }

  public addGuarantor(customerId: string, notes?: string | null, addedBy?: string | null): void {
    if (customerId === this.id) {
      throw new Error('A customer cannot be their own guarantor');
    }
    const alreadyExists = this._guarantors.some(g => g.customerId === customerId);
    if (alreadyExists) {
      throw new Error('This customer is already listed as a guarantor');
    }

    this._guarantors.push({
      customerId,
      notes: notes ?? null,
      addedAt: new Date(),
      addedBy: addedBy ?? null,
    });
    this._updatedAt = new Date();
  }

  public removeGuarantor(guarantorCustomerId: string): void {
    const initialLength = this._guarantors.length;
    this._guarantors = this._guarantors.filter(g => g.customerId !== guarantorCustomerId);
    if (this._guarantors.length === initialLength) {
      throw new Error('Guarantor not found on this customer');
    }
    this._updatedAt = new Date();
  }

  public softDelete(): void {
    if (Math.abs(this._outstandingBalance) > 1) {
      throw new Error(`Cannot delete: This customer has an outstanding balance of ${this._outstandingBalance}. Settle or write off balance first.`);
    }
    this._isDeleted = true;
    this._isActive = false;
    this._status = CustomerStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  public restore(): void {
    this._isDeleted = false;
    this._isActive = true;
    this._status = CustomerStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public updateOutstandingBalance(newBalance: number): void {
    this._outstandingBalance = newBalance;
    this._updatedAt = new Date();
  }

  public assignOwner(employeeId: string | null): void {
    this._ownerId = employeeId;
    this._updatedAt = new Date();
  }

  public changeStatus(status: CustomerStatus): void {
    this._status = status;
    this._isActive = status === CustomerStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public static create(
    params: Omit<CustomerProps, 'status' | 'isActive' | 'isDeleted' | 'createdAt' | 'updatedAt'> & {
      id: string;
      status?: CustomerStatus;
    }
  ): Customer {
    const customer = new Customer(params.id, {
      ...params,
      email: params.email ?? null,
      phone: params.phone ?? null,
      altPhone: params.altPhone ?? null,
      type: params.type ?? 'individual',
      contactPerson: params.contactPerson ?? null,
      avatar: params.avatar ?? null,
      gstNumber: params.gstNumber ?? null,
      panNumber: params.panNumber ?? null,
      billingAddress: params.billingAddress ?? null,
      shippingAddress: params.shippingAddress ?? null,
      openingBalance: params.openingBalance ?? 0,
      outstandingBalance: params.outstandingBalance ?? 0,
      creditLimit: params.creditLimit ?? 0,
      paymentTerms: params.paymentTerms ?? null,
      notes: params.notes ?? null,
      tags: params.tags ?? [],
      guarantors: params.guarantors ?? [],
      status: params.status ?? CustomerStatus.ACTIVE,
      isActive: true,
      isDeleted: false,
      ownerId: params.ownerId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    customer.addDomainEvent(new CustomerCreatedEvent(customer.id, customer.organizationId));

    return customer;
  }

  public static reconstitute(
    params: Omit<CustomerProps, 'isActive' | 'isDeleted'> & {
      id: string;
      isActive?: boolean;
      isDeleted?: boolean;
    }
  ): Customer {
    return new Customer(params.id, {
      ...params,
      isActive: params.isActive ?? true,
      isDeleted: params.isDeleted ?? false,
      email: params.email ?? null,
      phone: params.phone ?? null,
      altPhone: params.altPhone ?? null,
      type: params.type ?? 'individual',
      contactPerson: params.contactPerson ?? null,
      avatar: params.avatar ?? null,
      gstNumber: params.gstNumber ?? null,
      panNumber: params.panNumber ?? null,
      billingAddress: params.billingAddress ?? null,
      shippingAddress: params.shippingAddress ?? null,
      openingBalance: params.openingBalance ?? 0,
      outstandingBalance: params.outstandingBalance ?? 0,
      creditLimit: params.creditLimit ?? 0,
      paymentTerms: params.paymentTerms ?? null,
      notes: params.notes ?? null,
      tags: params.tags ?? [],
      guarantors: params.guarantors ?? [],
      ownerId: params.ownerId ?? null,
    });
  }
}

import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { AccountType } from '../value-objects/AccountingEnums';

export interface AccountProps {
  organizationId: string;
  code: string;
  name: string;
  type: AccountType;
  parent: string | null;
  isGroup: boolean;
  cachedBalance: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountParams {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: AccountType;
  parent?: string | null;
  isGroup?: boolean;
  metadata?: Record<string, any>;
}

export class Account extends AggregateRoot<string> {
  private _props: AccountProps;

  private constructor(id: string, props: AccountProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateAccountParams): Account {
    if (!params.code.trim()) throw new Error('Account code is required');
    if (!params.name.trim()) throw new Error('Account name is required');
    if (params.parent && params.parent === params.id) {
      throw new Error('An account cannot reference itself as its parent');
    }

    const now = new Date();
    return new Account(params.id, {
      organizationId: params.organizationId,
      code: params.code.trim().toUpperCase(),
      name: params.name.trim(),
      type: params.type,
      parent: params.parent ?? null,
      isGroup: params.isGroup ?? false,
      cachedBalance: 0,
      isActive: true,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AccountProps & { id: string }): Account {
    return new Account(props.id, props);
  }

  update(params: { name?: string; type?: AccountType; isActive?: boolean; metadata?: Record<string, any> }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Account name cannot be empty');
      this._props.name = params.name.trim();
    }
    if (params.type !== undefined) this._props.type = params.type;
    if (params.isActive !== undefined) this._props.isActive = params.isActive;
    if (params.metadata !== undefined) this._props.metadata = params.metadata;
    this._props.updatedAt = new Date();
  }

  reparent(newParentId: string | null): void {
    if (newParentId === this.id) {
      throw new Error('An account cannot reference itself as its parent');
    }
    this._props.parent = newParentId;
    this._props.updatedAt = new Date();
  }

  updateBalance(delta: number): void {
    this._props.cachedBalance = parseFloat((this._props.cachedBalance + delta).toFixed(2));
    this._props.updatedAt = new Date();
  }

  deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  activate(): void {
    this._props.isActive = true;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get code() { return this._props.code; }
  get name() { return this._props.name; }
  get type() { return this._props.type; }
  get parent() { return this._props.parent; }
  get isGroup() { return this._props.isGroup; }
  get cachedBalance() { return this._props.cachedBalance; }
  get isActive() { return this._props.isActive; }
  get props() { return { ...this._props }; }
}

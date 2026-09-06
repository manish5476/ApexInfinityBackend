import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { DomainError } from '../../../../shared/errors';

export interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface BranchProps {
  organizationId: string;
  name: string;
  branchCode: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBranchParams {
  id: string;
  organizationId: string;
  name: string;
  branchCode?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}

export class Branch extends AggregateRoot<string> {
  private _props: BranchProps;

  private constructor(id: string, props: BranchProps) {
    super(id);
    this._props = props;
  }

  public static create(params: CreateBranchParams): Branch {
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Branch name cannot be empty.');
    }
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required.');
    }

    const code = params.branchCode?.trim().toUpperCase() ||
      params.name.trim().slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    const now = new Date();
    return new Branch(params.id, {
      organizationId: params.organizationId,
      name: params.name.trim(),
      branchCode: code,
      address: params.address,
      phone: params.phone,
      email: params.email,
      isMainBranch: params.isMainBranch ?? false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: BranchProps & { id: string }): Branch {
    return new Branch(props.id, props);
  }

  public updateDetails(params: {
    name?: string;
    branchCode?: string;
    address?: BranchAddress;
    phone?: string;
    email?: string;
    isMainBranch?: boolean;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Branch name cannot be empty.');
      this._props.name = params.name.trim();
    }
    if (params.branchCode !== undefined) this._props.branchCode = params.branchCode.trim().toUpperCase();
    if (params.address !== undefined) this._props.address = { ...this._props.address, ...params.address };
    if (params.phone !== undefined) this._props.phone = params.phone;
    if (params.email !== undefined) this._props.email = params.email;
    if (params.isMainBranch !== undefined) this._props.isMainBranch = params.isMainBranch;
    this._props.updatedAt = new Date();
  }

  public setAsMainBranch(): void {
    this._props.isMainBranch = true;
    this._props.updatedAt = new Date();
  }

  public unsetMainBranch(): void {
    this._props.isMainBranch = false;
    this._props.updatedAt = new Date();
  }

  public deactivate(): void {
    if (this._props.isMainBranch) {
      throw new DomainError('Cannot deactivate the main branch.');
    }
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  public activate(): void {
    this._props.isActive = true;
    this._props.updatedAt = new Date();
  }

  public get organizationId(): string { return this._props.organizationId; }
  public get name(): string { return this._props.name; }
  public get branchCode(): string { return this._props.branchCode; }
  public get address(): BranchAddress | undefined { return this._props.address; }
  public get phone(): string | undefined { return this._props.phone; }
  public get email(): string | undefined { return this._props.email; }
  public get isMainBranch(): boolean { return this._props.isMainBranch; }
  public get isActive(): boolean { return this._props.isActive; }
  public get createdAt(): Date { return this._props.createdAt; }
  public get updatedAt(): Date { return this._props.updatedAt; }
  public get props(): BranchProps { return { ...this._props }; }
}

import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { OrganizationId } from '../value-objects/OrganizationId';
import { OrganizationCreatedEvent } from '../events/OrganizationCreatedEvent';
import { DomainError } from '../../../../shared/errors';

export interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface OrganizationSettings {
  currency?: string;
  timezone?: string;
  financialYearStart?: string;
}

export interface OrganizationProps {
  name: string;
  slug: string;
  isActive: boolean;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  uniqueShopId?: string;
  logo?: string;
  address?: OrganizationAddress;
  settings?: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization extends AggregateRoot<string> {
  private _name: string;
  private _slug: string;
  private _isActive: boolean;
  private _primaryEmail?: string;
  private _primaryPhone?: string;
  private _gstNumber?: string;
  private _uniqueShopId?: string;
  private _logo?: string;
  private _address?: OrganizationAddress;
  private _settings?: OrganizationSettings;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: OrganizationId, props: OrganizationProps) {
    super(id.value);
    this._name = props.name;
    this._slug = props.slug;
    this._isActive = props.isActive;
    this._primaryEmail = props.primaryEmail;
    this._primaryPhone = props.primaryPhone;
    this._gstNumber = props.gstNumber;
    this._uniqueShopId = props.uniqueShopId;
    this._logo = props.logo;
    this._address = props.address;
    this._settings = props.settings;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    name: string,
    slug: string,
    extra?: {
      primaryEmail?: string;
      primaryPhone?: string;
      gstNumber?: string;
      uniqueShopId?: string;
      logo?: string;
      address?: OrganizationAddress;
      settings?: OrganizationSettings;
    }
  ): Organization {
    if (!name || name.trim().length === 0) {
      throw new DomainError('Organization name cannot be empty.');
    }
    const cleanSlug = Organization.validateAndCleanSlug(slug);

    const id = new OrganizationId();
    const now = new Date();

    const organization = new Organization(id, {
      name: name.trim(),
      slug: cleanSlug,
      isActive: true,
      primaryEmail: extra?.primaryEmail,
      primaryPhone: extra?.primaryPhone,
      gstNumber: extra?.gstNumber,
      uniqueShopId: extra?.uniqueShopId,
      logo: extra?.logo,
      address: extra?.address,
      settings: extra?.settings,
      createdAt: now,
      updatedAt: now,
    });

    organization.addDomainEvent(new OrganizationCreatedEvent(id.value, organization.name, cleanSlug));
    return organization;
  }

  public static reconstitute(id: string, props: OrganizationProps): Organization {
    return new Organization(new OrganizationId(id), props);
  }

  public get name(): string {
    return this._name;
  }

  public get slug(): string {
    return this._slug;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get primaryEmail(): string | undefined {
    return this._primaryEmail;
  }

  public get primaryPhone(): string | undefined {
    return this._primaryPhone;
  }

  public get gstNumber(): string | undefined {
    return this._gstNumber;
  }

  public get uniqueShopId(): string | undefined {
    return this._uniqueShopId;
  }

  public get logo(): string | undefined {
    return this._logo;
  }

  public get address(): OrganizationAddress | undefined {
    return this._address;
  }

  public get settings(): OrganizationSettings | undefined {
    return this._settings;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get props(): OrganizationProps {
    return {
      name: this._name,
      slug: this._slug,
      isActive: this._isActive,
      primaryEmail: this._primaryEmail,
      primaryPhone: this._primaryPhone,
      gstNumber: this._gstNumber,
      uniqueShopId: this._uniqueShopId,
      logo: this._logo,
      address: this._address,
      settings: this._settings,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainError('Organization name cannot be empty.');
    }
    this._name = newName.trim();
    this._updatedAt = new Date();
  }

  public updateDetails(params: {
    name?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    gstNumber?: string;
    uniqueShopId?: string;
    logo?: string;
    address?: OrganizationAddress;
    settings?: OrganizationSettings;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Organization name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.primaryEmail !== undefined) this._primaryEmail = params.primaryEmail;
    if (params.primaryPhone !== undefined) this._primaryPhone = params.primaryPhone;
    if (params.gstNumber !== undefined) this._gstNumber = params.gstNumber;
    if (params.uniqueShopId !== undefined) this._uniqueShopId = params.uniqueShopId;
    if (params.logo !== undefined) this._logo = params.logo;
    if (params.address !== undefined) this._address = { ...this._address, ...params.address };
    if (params.settings !== undefined) this._settings = { ...this._settings, ...params.settings };
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new DomainError('Organization is already inactive.');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    if (this._isActive) {
      throw new DomainError('Organization is already active.');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  private static validateAndCleanSlug(slug: string): string {
    if (!slug || slug.trim().length === 0) {
      throw new DomainError('Organization slug cannot be empty.');
    }
    const cleaned = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (cleaned.length < 2) {
      throw new DomainError('Organization slug must be at least 2 characters long.');
    }
    return cleaned;
  }
}

import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { OrganizationId } from '../value-objects/OrganizationId';
import { OrganizationCreatedEvent } from '../events/OrganizationCreatedEvent';
import { DomainError } from '../../../../shared/errors';
import crypto from 'crypto';

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

export interface OrganizationFeatures {
  whatsappEnabled?: boolean;
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
  owner?: string;
  mainBranch?: string;
  branches?: string[];
  secondaryEmail?: string;
  secondaryPhone?: string;
  features?: OrganizationFeatures;
  platformDelivery?: { enabled: boolean };
  whatsappWallet?: { credits: number };
  superAdminRole?: string;
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
  private _owner?: string;
  private _mainBranch?: string;
  private _branches?: string[];
  private _secondaryEmail?: string;
  private _secondaryPhone?: string;
  private _features?: OrganizationFeatures;
  private _platformDelivery?: { enabled: boolean };
  private _whatsappWallet?: { credits: number };
  private _superAdminRole?: string;
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
    this._owner = props.owner;
    this._mainBranch = props.mainBranch;
    this._branches = props.branches || [];
    this._secondaryEmail = props.secondaryEmail;
    this._secondaryPhone = props.secondaryPhone;
    this._features = props.features;
    this._platformDelivery = props.platformDelivery;
    this._whatsappWallet = props.whatsappWallet;
    this._superAdminRole = props.superAdminRole || 'superadmin';
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
      owner?: string;
      mainBranch?: string;
      branches?: string[];
      secondaryEmail?: string;
      secondaryPhone?: string;
      features?: OrganizationFeatures;
      platformDelivery?: { enabled: boolean };
      whatsappWallet?: { credits: number };
      superAdminRole?: string;
    }
  ): Organization {
    if (!name || name.trim().length === 0) {
      throw new DomainError('Organization name cannot be empty.');
    }
    const cleanSlug = Organization.validateAndCleanSlug(slug);

    const id = new OrganizationId();
    const now = new Date();
    
    const shopId = (extra?.uniqueShopId || `ORG-${crypto.randomBytes(3).toString('hex')}`).toUpperCase();

    const organization = new Organization(id, {
      name: name.trim(),
      slug: cleanSlug,
      isActive: true,
      primaryEmail: extra?.primaryEmail,
      primaryPhone: extra?.primaryPhone,
      gstNumber: extra?.gstNumber,
      uniqueShopId: shopId,
      logo: extra?.logo,
      address: extra?.address,
      settings: extra?.settings,
      owner: extra?.owner,
      mainBranch: extra?.mainBranch,
      branches: extra?.branches || [],
      secondaryEmail: extra?.secondaryEmail,
      secondaryPhone: extra?.secondaryPhone,
      features: extra?.features,
      platformDelivery: extra?.platformDelivery,
      whatsappWallet: extra?.whatsappWallet,
      superAdminRole: extra?.superAdminRole || 'superadmin',
      createdAt: now,
      updatedAt: now,
    });

    organization.addDomainEvent(new OrganizationCreatedEvent(id.value, organization.name, cleanSlug));
    return organization;
  }

  public static reconstitute(id: string, props: OrganizationProps): Organization {
    return new Organization(new OrganizationId(id), props);
  }

  public get name(): string { return this._name; }
  public get slug(): string { return this._slug; }
  public get isActive(): boolean { return this._isActive; }
  public get primaryEmail(): string | undefined { return this._primaryEmail; }
  public get primaryPhone(): string | undefined { return this._primaryPhone; }
  public get gstNumber(): string | undefined { return this._gstNumber; }
  public get uniqueShopId(): string | undefined { return this._uniqueShopId; }
  public get logo(): string | undefined { return this._logo; }
  public get address(): OrganizationAddress | undefined { return this._address; }
  public get settings(): OrganizationSettings | undefined { return this._settings; }
  
  public get owner(): string | undefined { return this._owner; }
  public get mainBranch(): string | undefined { return this._mainBranch; }
  public get branches(): string[] | undefined { return this._branches; }
  public get secondaryEmail(): string | undefined { return this._secondaryEmail; }
  public get secondaryPhone(): string | undefined { return this._secondaryPhone; }
  public get features(): OrganizationFeatures | undefined { return this._features; }
  public get platformDelivery(): { enabled: boolean } | undefined { return this._platformDelivery; }
  public get whatsappWallet(): { credits: number } | undefined { return this._whatsappWallet; }
  public get superAdminRole(): string | undefined { return this._superAdminRole; }

  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }

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
      owner: this._owner,
      mainBranch: this._mainBranch,
      branches: this._branches,
      secondaryEmail: this._secondaryEmail,
      secondaryPhone: this._secondaryPhone,
      features: this._features,
      platformDelivery: this._platformDelivery,
      whatsappWallet: this._whatsappWallet,
      superAdminRole: this._superAdminRole,
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

  public addBranch(branchId: string): void {
    if (!this._branches) {
      this._branches = [];
    }
    if (!this._branches.includes(branchId)) {
      this._branches.push(branchId);
      this._updatedAt = new Date();
    }
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
    owner?: string;
    mainBranch?: string;
    branches?: string[];
    secondaryEmail?: string;
    secondaryPhone?: string;
    features?: OrganizationFeatures;
    platformDelivery?: { enabled: boolean };
    whatsappWallet?: { credits: number };
    superAdminRole?: string;
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
    
    if (params.owner !== undefined) this._owner = params.owner;
    if (params.mainBranch !== undefined) this._mainBranch = params.mainBranch;
    if (params.branches !== undefined) this._branches = params.branches;
    if (params.secondaryEmail !== undefined) this._secondaryEmail = params.secondaryEmail;
    if (params.secondaryPhone !== undefined) this._secondaryPhone = params.secondaryPhone;
    if (params.features !== undefined) this._features = params.features;
    if (params.platformDelivery !== undefined) this._platformDelivery = params.platformDelivery;
    if (params.whatsappWallet !== undefined) this._whatsappWallet = params.whatsappWallet;
    if (params.superAdminRole !== undefined) this._superAdminRole = params.superAdminRole;

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

import { Organization } from '../../domain/entities/Organization';
import { OrganizationResponseDto } from '../dto/OrganizationResponseDto';
import { IMapper } from '../../../../core/application/IMapper';

export interface OrganizationPersistenceData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  uniqueShopId?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    financialYearStart?: string;
  };
  owner?: string;
  mainBranch?: string;
  branches?: string[];
  secondaryEmail?: string;
  secondaryPhone?: string;
  features?: {
    whatsappEnabled?: boolean;
  };
  platformDelivery?: {
    enabled?: boolean;
  };
  whatsappWallet?: {
    credits?: number;
  };
  superAdminRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationMapper implements IMapper<Organization, OrganizationPersistenceData, OrganizationResponseDto> {
  public toDomain(raw: OrganizationPersistenceData): Organization {
    return Organization.reconstitute(raw._id, {
      name: raw.name,
      slug: raw.slug,
      isActive: raw.isActive,
      primaryEmail: raw.primaryEmail,
      primaryPhone: raw.primaryPhone,
      gstNumber: raw.gstNumber,
      uniqueShopId: raw.uniqueShopId,
      logo: raw.logo,
      address: raw.address,
      settings: raw.settings,
      owner: raw.owner,
      mainBranch: raw.mainBranch,
      branches: raw.branches,
      secondaryEmail: raw.secondaryEmail,
      secondaryPhone: raw.secondaryPhone,
      features: raw.features,
      platformDelivery: raw.platformDelivery ? { enabled: raw.platformDelivery.enabled ?? false } : undefined,
      whatsappWallet: raw.whatsappWallet ? { credits: raw.whatsappWallet.credits ?? 0 } : undefined,
      superAdminRole: raw.superAdminRole,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public toPersistence(entity: Organization): OrganizationPersistenceData {
    return {
      _id: entity.id,
      name: entity.name,
      slug: entity.slug,
      isActive: entity.isActive,
      primaryEmail: entity.primaryEmail,
      primaryPhone: entity.primaryPhone,
      gstNumber: entity.gstNumber,
      uniqueShopId: entity.uniqueShopId,
      logo: entity.logo,
      address: entity.address,
      settings: entity.settings,
      owner: entity.owner,
      mainBranch: entity.mainBranch,
      branches: entity.branches,
      secondaryEmail: entity.secondaryEmail,
      secondaryPhone: entity.secondaryPhone,
      features: entity.features,
      platformDelivery: entity.platformDelivery,
      whatsappWallet: entity.whatsappWallet,
      superAdminRole: entity.superAdminRole,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public toDto(entity: Organization): OrganizationResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      isActive: entity.isActive,
      primaryEmail: entity.primaryEmail,
      primaryPhone: entity.primaryPhone,
      gstNumber: entity.gstNumber,
      uniqueShopId: entity.uniqueShopId,
      logo: entity.logo,
      address: entity.address,
      settings: entity.settings,
      owner: entity.owner,
      mainBranch: entity.mainBranch,
      branches: entity.branches,
      secondaryEmail: entity.secondaryEmail,
      secondaryPhone: entity.secondaryPhone,
      features: entity.features,
      platformDelivery: entity.platformDelivery,
      whatsappWallet: entity.whatsappWallet,
      superAdminRole: entity.superAdminRole,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

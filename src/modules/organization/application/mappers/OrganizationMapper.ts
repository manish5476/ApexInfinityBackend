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
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

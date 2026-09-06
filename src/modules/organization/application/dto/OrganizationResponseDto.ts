export interface OrganizationResponseDto {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

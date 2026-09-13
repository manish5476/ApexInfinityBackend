export interface CreateOrganizationDto {
  // Organization fields
  organizationName: string;
  slug?: string;
  uniqueShopId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  mainBranchName?: string;
  mainBranchAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  // Owner fields
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

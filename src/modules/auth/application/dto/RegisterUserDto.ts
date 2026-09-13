export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
  organizationSlug?: string;
  organizationName?: string;
  uniqueShopId?: string;
  phone?: string;
  roles?: string[];
}

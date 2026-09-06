export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
  uniqueShopId?: string;
  phone?: string;
  roles?: string[];
}

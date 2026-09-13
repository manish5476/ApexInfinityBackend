export interface LoginDto {
  email: string;
  password: string;
  uniqueShopId?: string;
  shopId?: string;
  organizationSlug?: string;
  orgSlug?: string;
  organizationName?: string;
  organizationId?: string;
  device?: DeviceMeta;
}

export interface UserResponseDto {
  id: string;
  _id?: string;
  email: string;
  name: string;
  organizationId?: string;
  branchId?: string;
  role?: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  status?: string;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceMeta {
  browser?: string;
  os?: string;
  deviceType?: string;
  ipAddress?: string;
}

export interface AuthResultDto {
  token: string;
  refreshToken?: string;
  expiresIn?: string;
  sessionId?: string;
  user: UserResponseDto;
  session?: {
    id?: string;
    _id?: string;
    browser?: string;
    os?: string;
    deviceType?: string;
    ipAddress?: string;
    lastActivityAt?: Date;
  };
  organization?: {
    id: string;
    _id?: string;
    name: string;
    uniqueShopId: string;
  };
}

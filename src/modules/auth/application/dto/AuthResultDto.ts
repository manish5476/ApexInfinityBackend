export interface LoginDto {
  email: string;
  password: string;
  uniqueShopId?: string;
  device?: DeviceMeta;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
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
}

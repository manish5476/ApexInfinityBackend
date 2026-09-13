export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResult { token: string; expiresIn: string | number; sessionId: string; user: CurrentUser; }
export interface LoginInput { email: string; password: string; uniqueShopId?: string; }

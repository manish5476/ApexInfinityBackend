import type { ApiClient } from '@/lib/api/client';
import type { AuthResult, CurrentUser, LoginInput } from '@/types/auth/auth';

export const authApi = {
  login: (client: ApiClient, input: LoginInput) => client.request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: (client: ApiClient) => client.request<CurrentUser>('/auth/me'),
  refresh: (client: ApiClient) => client.request<AuthResult>('/auth/refresh-token', { method: 'POST' }),
  logout: (client: ApiClient) => client.request<void>('/auth/logout', { method: 'POST' }),
};

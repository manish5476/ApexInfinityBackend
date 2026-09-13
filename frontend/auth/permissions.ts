import type { CurrentUser } from '@/types/auth/auth';

export const can = (user: CurrentUser | null, permission: string) => Boolean(user?.permissions.includes(permission));
export const hasRole = (user: CurrentUser | null, role: string) => Boolean(user?.roles.includes(role));
export const canAccess = can;
export const canPerform = can;

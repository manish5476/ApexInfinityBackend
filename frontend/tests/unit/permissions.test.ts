import { describe, expect, it } from 'vitest';
import { can, hasRole } from '@/auth/permissions';

const user = { id: 'user-id', email: 'user@example.com', name: 'User', roles: ['admin'], permissions: ['products.read'] };
describe('permission helpers', () => { it('checks backend-issued roles and permissions', () => { expect(can(user, 'products.read')).toBe(true); expect(can(user, 'products.write')).toBe(false); expect(hasRole(user, 'admin')).toBe(true); }); });

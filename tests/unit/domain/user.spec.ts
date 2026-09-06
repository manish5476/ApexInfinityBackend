import { User } from '../../../src/modules/auth/domain/entities/User';
import { DomainError } from '../../../src/shared/errors';

describe('User Domain Entity (Pure Decoupled Unit Test)', () => {
  it('should create an active user and record UserRegisteredEvent', () => {
    const user = User.create({
      email: 'john.doe@apexinfinity.com',
      passwordHash: 'hashed_password_123',
      name: 'John Doe',
      organizationId: 'org-1',
      roles: ['admin'],
    });

    expect(user.id).toBeDefined();
    expect(user.email.value).toBe('john.doe@apexinfinity.com');
    expect(user.name).toBe('John Doe');
    expect(user.organizationId).toBe('org-1');
    expect(user.roles).toContain('admin');
    expect(user.isActive).toBe(true);

    // Verify domain event
    expect(user.domainEvents).toHaveLength(1);
    expect(user.domainEvents[0]?.eventName).toBe('user.registered');
    expect(user.domainEvents[0]?.aggregateId).toBe(user.id);
  });

  it('should reject invalid email format with DomainError', () => {
    expect(() =>
      User.create({
        email: 'invalid-email-no-at',
        passwordHash: 'hash',
        name: 'John',
      })
    ).toThrow(DomainError);
  });

  it('should reject empty name with DomainError', () => {
    expect(() =>
      User.create({
        email: 'john@example.com',
        passwordHash: 'hash',
        name: '',
      })
    ).toThrow(DomainError);
  });

  it('should allow changing password and updating timestamps', () => {
    const user = User.create({
      email: 'user@example.com',
      passwordHash: 'old_hash',
      name: 'User',
    });

    user.changePassword('new_hash_456');
    expect(user.passwordHash).toBe('new_hash_456');
  });

  it('should allow activating and deactivating user', () => {
    const user = User.create({
      email: 'active@example.com',
      passwordHash: 'hash',
      name: 'Active User',
    });

    user.deactivate();
    expect(user.isActive).toBe(false);

    expect(() => user.deactivate()).toThrow(DomainError);

    user.activate();
    expect(user.isActive).toBe(true);
  });

  it('should apply a valid password reset token and then clear it', () => {
    const user = User.create({
      email: 'reset@example.com',
      passwordHash: 'old_hash',
      name: 'Reset User',
    });

    user.requestPasswordReset('token-hash', new Date(Date.now() + 60_000));
    user.applyPasswordReset('new_hash');
    expect(user.passwordHash).toBe('new_hash');
    expect(user.passwordResetTokenHash).toBeUndefined();
  });
});

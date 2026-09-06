import { Organization } from '../../../src/modules/organization/domain/entities/Organization';
import { DomainError } from '../../../src/shared/errors';

describe('Organization Domain Entity (Decoupled Unit Test)', () => {
  it('should create an active organization with a normalized slug and record domain event', () => {
    const org = Organization.create('Apex Infinity Global', 'Apex-Infinity_Global!');

    expect(org.id).toBeDefined();
    expect(org.name).toBe('Apex Infinity Global');
    expect(org.slug).toBe('apex-infinity-global');
    expect(org.isActive).toBe(true);
    expect(org.createdAt).toBeInstanceOf(Date);

    // Verify domain event
    expect(org.domainEvents).toHaveLength(1);
    expect(org.domainEvents[0]?.eventName).toBe('organization.created');
    expect(org.domainEvents[0]?.aggregateId).toBe(org.id);
  });

  it('should reject empty organization name with DomainError', () => {
    expect(() => Organization.create('', 'apex-crm')).toThrow(DomainError);
    expect(() => Organization.create('   ', 'apex-crm')).toThrow(DomainError);
  });

  it('should reject empty or invalid slug with DomainError', () => {
    expect(() => Organization.create('Apex', '')).toThrow(DomainError);
    expect(() => Organization.create('Apex', '!')).toThrow(DomainError);
  });

  it('should allow deactivating and activating an organization', () => {
    const org = Organization.create('Tech Corp', 'tech-corp');
    expect(org.isActive).toBe(true);

    org.deactivate();
    expect(org.isActive).toBe(false);

    // Deactivating already inactive should throw
    expect(() => org.deactivate()).toThrow(DomainError);

    org.activate();
    expect(org.isActive).toBe(true);
  });

  it('should allow updating organization name', () => {
    const org = Organization.create('Old Name', 'org-slug');
    org.updateName('New Name');
    expect(org.name).toBe('New Name');
  });
});

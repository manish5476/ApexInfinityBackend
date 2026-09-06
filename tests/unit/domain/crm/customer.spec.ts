import { Customer } from '../../../../src/modules/crm/domain/entities/Customer';
import { CustomerStatus } from '../../../../src/modules/crm/domain/value-objects/CustomerStatus';
import { CustomerCreatedEvent } from '../../../../src/modules/crm/domain/events/CustomerCreatedEvent';

describe('Customer Entity', () => {
  const baseParams = {
    id: 'customer-uuid-1',
    organizationId: 'org-1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    ownerId: null,
  };

  it('should create a customer with ACTIVE status', () => {
    const customer = Customer.create(baseParams);

    expect(customer.id).toBe(baseParams.id);
    expect(customer.name).toBe('Acme Corp');
    expect(customer.email).toBe('contact@acme.com');
    expect(customer.status).toBe(CustomerStatus.ACTIVE);
    expect(customer.ownerId).toBeNull();
    expect(customer.organizationId).toBe('org-1');
  });

  it('should raise a CustomerCreatedEvent on creation', () => {
    const customer = Customer.create(baseParams);
    expect(customer.domainEvents).toHaveLength(1);
    expect(customer.domainEvents[0]).toBeInstanceOf(CustomerCreatedEvent);
    expect((customer.domainEvents[0] as CustomerCreatedEvent).payload.customerId).toBe(baseParams.id);
  });

  it('should assign an owner', () => {
    const customer = Customer.create(baseParams);
    customer.assignOwner('employee-1');
    expect(customer.ownerId).toBe('employee-1');
  });

  it('should change status to INACTIVE', () => {
    const customer = Customer.create(baseParams);
    customer.changeStatus(CustomerStatus.INACTIVE);
    expect(customer.status).toBe(CustomerStatus.INACTIVE);
  });

  it('should reconstitute from props', () => {
    const customer = Customer.reconstitute({
      id: 'customer-recon-1',
      organizationId: 'org-1',
      name: 'Test Corp',
      email: 'test@test.com',
      status: CustomerStatus.CHURNED,
      ownerId: 'emp-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(customer.status).toBe(CustomerStatus.CHURNED);
    expect(customer.ownerId).toBe('emp-1');
    expect(customer.domainEvents).toHaveLength(0);
  });

  it('should update customer details correctly', () => {
    const customer = Customer.create(baseParams);
    customer.updateDetails({
      phone: '9876543210',
      type: 'business',
      contactPerson: 'John Doe',
      gstNumber: '29ABCDE1234F1Z5',
      notes: 'VIP client',
      tags: ['vip', 'wholesale'],
    });

    expect(customer.phone).toBe('9876543210');
    expect(customer.type).toBe('business');
    expect(customer.contactPerson).toBe('John Doe');
    expect(customer.gstNumber).toBe('29ABCDE1234F1Z5');
    expect(customer.notes).toBe('VIP client');
    expect(customer.tags).toEqual(['vip', 'wholesale']);
  });

  it('should enforce non-negative credit limit', () => {
    const customer = Customer.create(baseParams);
    customer.updateCreditLimit(50000);
    expect(customer.creditLimit).toBe(50000);

    expect(() => customer.updateCreditLimit(-100)).toThrow('Credit limit cannot be negative');
  });

  it('should add and remove guarantors with invariants', () => {
    const customer = Customer.create(baseParams);

    // Self-guarantee guard
    expect(() => customer.addGuarantor(customer.id)).toThrow('A customer cannot be their own guarantor');

    // Add valid guarantor
    customer.addGuarantor('guarantor-1', 'Family relation');
    expect(customer.guarantors).toHaveLength(1);
    expect(customer.guarantors[0]!.customerId).toBe('guarantor-1');
    expect(customer.guarantors[0]!.notes).toBe('Family relation');

    // Duplicate guarantor guard
    expect(() => customer.addGuarantor('guarantor-1')).toThrow('This customer is already listed as a guarantor');

    // Remove guarantor
    customer.removeGuarantor('guarantor-1');
    expect(customer.guarantors).toHaveLength(0);

    // Removing non-existent guarantor throws
    expect(() => customer.removeGuarantor('guarantor-1')).toThrow('Guarantor not found on this customer');
  });

  it('should prevent soft delete if outstanding balance exists', () => {
    const customer = Customer.create(baseParams);
    customer.updateOutstandingBalance(2500);

    expect(() => customer.softDelete()).toThrow('Cannot delete: This customer has an outstanding balance of 2500');

    // If balance is 0 or <= 1, deletion succeeds
    customer.updateOutstandingBalance(0);
    customer.softDelete();
    expect(customer.isDeleted).toBe(true);
    expect(customer.isActive).toBe(false);

    // Restore customer
    customer.restore();
    expect(customer.isDeleted).toBe(false);
    expect(customer.isActive).toBe(true);
  });
});


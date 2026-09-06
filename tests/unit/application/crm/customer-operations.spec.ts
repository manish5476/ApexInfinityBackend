import { InMemoryCustomerRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryCustomerRepository';
import { Customer } from '../../../../src/modules/crm/domain/entities/Customer';
import { GetCustomerByIdUseCase } from '../../../../src/modules/crm/application/use-cases/GetCustomerByIdUseCase';
import { UpdateCustomerUseCase } from '../../../../src/modules/crm/application/use-cases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../../../src/modules/crm/application/use-cases/DeleteCustomerUseCase';
import { RestoreCustomerUseCase } from '../../../../src/modules/crm/application/use-cases/RestoreCustomerUseCase';
import { UpdateCreditLimitUseCase } from '../../../../src/modules/crm/application/use-cases/UpdateCreditLimitUseCase';
import { AddGuarantorUseCase } from '../../../../src/modules/crm/application/use-cases/AddGuarantorUseCase';
import { RemoveGuarantorUseCase } from '../../../../src/modules/crm/application/use-cases/RemoveGuarantorUseCase';
import { GetGuaranteedCustomersUseCase } from '../../../../src/modules/crm/application/use-cases/GetGuaranteedCustomersUseCase';
import { SearchCustomersUseCase } from '../../../../src/modules/crm/application/use-cases/SearchCustomersUseCase';
import { CheckDuplicateCustomerUseCase } from '../../../../src/modules/crm/application/use-cases/CheckDuplicateCustomerUseCase';
import { ListCustomersUseCase } from '../../../../src/modules/crm/application/use-cases/ListCustomersUseCase';

class MockUoW {
  async runInTransaction<T>(fn: () => Promise<T>) { return fn(); }
}

describe('Customer Application Operations', () => {
  let repo: InMemoryCustomerRepository;
  let uow: MockUoW;
  const context = { organizationId: 'org-1' };

  beforeEach(async () => {
    repo = new InMemoryCustomerRepository();
    uow = new MockUoW();

    // Seed customer 1
    const cust1 = Customer.create({
      id: 'cust-1',
      organizationId: 'org-1',
      name: 'Alpha Traders',
      email: 'alpha@traders.com',
      phone: '9876543210',
      gstNumber: '29ABCDE1234F1Z5',
    });
    // Seed customer 2 (potential guarantor)
    const cust2 = Customer.create({
      id: 'cust-2',
      organizationId: 'org-1',
      name: 'Beta Guarantor',
      email: 'beta@guarantor.com',
      phone: '9876543211',
    });

    await repo.save(cust1);
    await repo.save(cust2);
  });

  describe('GetCustomerByIdUseCase', () => {
    it('should return customer and emit warning when credit limit > 0 and no guarantors', async () => {
      const cust = await repo.findById({ id: 'cust-1', organizationId: 'org-1' });
      cust!.updateCreditLimit(100000);
      await repo.save(cust!);

      const useCase = new GetCustomerByIdUseCase(repo);
      const result = await useCase.execute({ id: 'cust-1' }, context);

      expect(result.customer.id).toBe('cust-1');
      expect(result.customer.creditLimit).toBe(100000);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('This customer has a credit limit but no guarantors');
    });

    it('should throw if customer does not exist', async () => {
      const useCase = new GetCustomerByIdUseCase(repo);
      await expect(useCase.execute({ id: 'non-existent' }, context)).rejects.toThrow('Customer not found');
    });
  });

  describe('UpdateCustomerUseCase', () => {
    it('should update customer profile details', async () => {
      const useCase = new UpdateCustomerUseCase(repo, uow as any);
      const updated = await useCase.execute(
        {
          id: 'cust-1',
          data: {
            name: 'Alpha Traders Private Limited',
            contactPerson: 'Alice',
            type: 'business',
          },
        },
        context
      );

      expect(updated.name).toBe('Alpha Traders Private Limited');
      expect(updated.contactPerson).toBe('Alice');
      expect(updated.type).toBe('business');
    });

    it('should throw if changing email to an existing one in the same org', async () => {
      const useCase = new UpdateCustomerUseCase(repo, uow as any);
      await expect(
        useCase.execute({ id: 'cust-1', data: { email: 'beta@guarantor.com' } }, context)
      ).rejects.toThrow('Customer with this email already exists in this organization');
    });
  });

  describe('DeleteCustomerUseCase & RestoreCustomerUseCase', () => {
    it('should soft-delete customer and restore customer', async () => {
      const deleteUseCase = new DeleteCustomerUseCase(repo, uow as any);
      const restoreUseCase = new RestoreCustomerUseCase(repo, uow as any);

      const delRes = await deleteUseCase.execute({ id: 'cust-1' }, context);
      expect(delRes.message).toBe('Customer deleted successfully.');

      const afterDelete = await repo.findById({ id: 'cust-1', organizationId: 'org-1' });
      expect(afterDelete!.isDeleted).toBe(true);
      expect(afterDelete!.isActive).toBe(false);

      const restored = await restoreUseCase.execute({ id: 'cust-1' }, context);
      expect(restored.isDeleted).toBe(false);
      expect(restored.isActive).toBe(true);
    });
  });

  describe('UpdateCreditLimitUseCase', () => {
    it('should update credit limit and report warning when unsecured', async () => {
      const useCase = new UpdateCreditLimitUseCase(repo, uow as any);
      const result = await useCase.execute({ id: 'cust-1', creditLimit: 25000 }, context);

      expect(result.customer.creditLimit).toBe(25000);
      expect(result.warning).toBeDefined();
    });
  });

  describe('Guarantors Management', () => {
    it('should add guarantor, list guaranteed customers, and remove guarantor', async () => {
      const addUseCase = new AddGuarantorUseCase(repo, uow as any);
      const getGuaranteedUseCase = new GetGuaranteedCustomersUseCase(repo);
      const removeUseCase = new RemoveGuarantorUseCase(repo, uow as any);

      // Add guarantor
      const addResult = await addUseCase.execute(
        { customerId: 'cust-1', guarantorId: 'cust-2', notes: 'Partner vouch' },
        context
      );
      expect(addResult.message).toContain('Beta Guarantor has been added as a guarantor');
      expect(addResult.customer.guarantors).toHaveLength(1);

      // Check reverse lookup: customers guaranteed by cust-2
      const guaranteed = await getGuaranteedUseCase.execute({ guarantorId: 'cust-2' }, context);
      expect(guaranteed.count).toBe(1);
      expect(guaranteed.guaranteedCustomers[0]!.id).toBe('cust-1');

      // Remove guarantor
      const removeResult = await removeUseCase.execute(
        { customerId: 'cust-1', guarantorId: 'cust-2' },
        context
      );
      expect(removeResult.message).toBe('Guarantor removed successfully.');
      expect(removeResult.customer.guarantors).toHaveLength(0);
    });

    it('should forbid self-guarantee', async () => {
      const addUseCase = new AddGuarantorUseCase(repo, uow as any);
      await expect(
        addUseCase.execute({ customerId: 'cust-1', guarantorId: 'cust-1' }, context)
      ).rejects.toThrow('A customer cannot be their own guarantor');
    });
  });

  describe('Search and Duplicate Checks', () => {
    it('should search customers by substring', async () => {
      const searchUseCase = new SearchCustomersUseCase(repo);
      const res = await searchUseCase.execute({ query: 'Alpha' }, context);
      expect(res.count).toBe(1);
      expect(res.customers[0]!.name).toBe('Alpha Traders');
    });

    it('should check duplicate by phone, email, and GST', async () => {
      const dupUseCase = new CheckDuplicateCustomerUseCase(repo);

      const byPhone = await dupUseCase.execute({ phone: '9876543210' }, context);
      expect(byPhone.isDuplicate).toBe(true);
      expect(byPhone.existingCustomer?.id).toBe('cust-1');

      const byGst = await dupUseCase.execute({ gstNumber: '29ABCDE1234F1Z5' }, context);
      expect(byGst.isDuplicate).toBe(true);

      const byUnique = await dupUseCase.execute({ phone: '1111111111' }, context);
      expect(byUnique.isDuplicate).toBe(false);
      expect(byUnique.existingCustomer).toBeNull();
    });
  });

  describe('ListCustomersUseCase', () => {
    it('should list customers with pagination and filtering', async () => {
      const listUseCase = new ListCustomersUseCase(repo);
      const res = await listUseCase.execute({ page: 1, limit: 10, search: 'Beta' }, context);
      expect(res.total).toBe(1);
      expect(res.data[0]!.name).toBe('Beta Guarantor');
    });
  });
});

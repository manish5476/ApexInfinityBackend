import { InMemoryDropdownRepository } from '../../../../src/modules/master/infrastructure/repositories/InMemoryDropdownRepository';
import { MasterListUseCases } from '../../../../src/modules/master/application/use-cases/MasterListUseCases';
import { ValidationError, NotFoundError } from '../../../../src/shared/errors';

describe('MasterListUseCases', () => {
  let repo: InMemoryDropdownRepository;
  let useCases: MasterListUseCases;
  const orgId = 'org-master-list-test';

  beforeEach(() => {
    repo = new InMemoryDropdownRepository();
    useCases = new MasterListUseCases(repo);

    repo.seed('customers', [
      { _id: 'cust-1', organizationId: orgId, name: 'ACME Corp', email: 'acme@example.com' },
      { _id: 'cust-2', organizationId: orgId, name: 'Beta Ltd', email: 'beta@example.com' },
    ]);

    repo.seed('products', [
      { _id: 'prod-1', organizationId: orgId, name: 'Laptop Pro', sku: 'LP-001' },
    ]);
  });

  it('should return master list snapshot', async () => {
    const snapshot = await useCases.getMasterListSnapshot(orgId);
    expect(snapshot).toHaveProperty('customers');
    expect(snapshot).toHaveProperty('products');
    expect(snapshot).toHaveProperty('masters');
  });

  it('should return paginated specific entity list', async () => {
    const res = await useCases.getSpecificList(orgId, 'customers', { page: 1, limit: 10 });
    expect(res.status).toBe('success');
    expect(res.results).toBe(2);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('should throw ValidationError if type is missing in getSpecificList', async () => {
    await expect(useCases.getSpecificList(orgId, '', {})).rejects.toThrow(ValidationError);
  });

  it('should return filter options for entity type', async () => {
    const opts = await useCases.getFilterOptions(orgId, 'customers');
    expect(opts.entityType).toBe('customers');
    expect(opts).toHaveProperty('common');
  });

  it('should return quick stats KPI dashboard', async () => {
    const stats = await useCases.getQuickStats(orgId, 'today');
    expect(stats).toHaveProperty('period');
    expect(stats).toHaveProperty('data');
    expect((stats as any).data.customers).toBe(2);
    expect((stats as any).data.products).toBe(1);
  });

  it('should retrieve entity details or throw NotFoundError', async () => {
    const details = await useCases.getEntityDetails(orgId, 'customers', 'cust-1');
    expect(details.entity).toBeDefined();
    expect((details.entity as any).name).toBe('ACME Corp');

    await expect(useCases.getEntityDetails(orgId, 'customers', 'non-existent')).rejects.toThrow(NotFoundError);
  });

  it('should provide static permissions metadata and options meta', () => {
    const perms = useCases.getPermissionsMetadata();
    expect(perms.length).toBeGreaterThan(5);
    expect(perms.some((p) => p.module === 'master')).toBe(true);

    const options = useCases.getOptionsMeta();
    expect(options.status.length).toBeGreaterThan(0);
    expect(options.invoiceStatus.length).toBeGreaterThan(0);
  });
});

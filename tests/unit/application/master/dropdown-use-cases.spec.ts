import { InMemoryDropdownRepository } from '../../../../src/modules/master/infrastructure/repositories/InMemoryDropdownRepository';
import { DropdownUseCases } from '../../../../src/modules/master/application/use-cases/DropdownUseCases';

describe('DropdownUseCases', () => {
  let repo: InMemoryDropdownRepository;
  let useCases: DropdownUseCases;
  const orgId = 'org-dropdown-test';

  beforeEach(() => {
    repo = new InMemoryDropdownRepository();
    useCases = new DropdownUseCases(repo);

    repo.seed('products', [
      { _id: 'prod-1', organizationId: orgId, name: 'MacBook Pro', code: 'MBP-14', price: 1999, isActive: true },
      { _id: 'prod-2', organizationId: orgId, name: 'MacBook Air', code: 'MBA-13', price: 1099, isActive: true },
      { _id: 'prod-3', organizationId: orgId, name: 'iPad Air', code: 'IPA-11', price: 599, isActive: false },
      { _id: 'prod-4', organizationId: 'other-org', name: 'Other Item', code: 'OTH-1', price: 100, isActive: true },
    ]);
  });

  it('should project entities to standard dropdown format { label, value, data }', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
    });

    expect(res.total).toBe(3);
    expect(res.data.length).toBe(3);
    expect(res.data[0]).toEqual({
      label: 'MacBook Pro',
      value: 'prod-1',
      data: expect.objectContaining({ name: 'MacBook Pro' }),
    });
  });

  it('should filter by active status', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
      isActive: true,
    });

    expect(res.total).toBe(2);
    expect(res.data.every((i) => (i.data as any).isActive === true)).toBe(true);
  });

  it('should support search query', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
      search: 'air',
    });

    expect(res.total).toBe(2);
    expect(res.data.some((i) => i.label === 'MacBook Air')).toBe(true);
    expect(res.data.some((i) => i.label === 'iPad Air')).toBe(true);
  });

  it('should support template labels and custom valueField', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
      labelTemplate: '{{name}} [{{code}}]',
      valueField: 'code',
      metaFields: ['price'],
    });

    expect(res.data[0]?.label).toBe('MacBook Pro [MBP-14]');
    expect(res.data[0]?.value).toBe('MBP-14');
    expect(res.data[0]?.meta).toEqual({ price: 1999 });
  });

  it('should prioritize includeIds and respect excludeIds', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
      includeIds: ['prod-2'],
      excludeIds: ['prod-1'],
    });

    // prod-2 should be included first, prod-1 excluded
    expect(res.data[0]?.value).toBe('prod-2');
    expect(res.data.every((i) => i.value !== 'prod-1')).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    const res = await useCases.getDropdown('products', {
      organizationId: orgId,
      page: 1,
      limit: 2,
    });

    expect(res.page).toBe(1);
    expect(res.data.length).toBe(2);
    expect(res.hasMore).toBe(true);
    expect(res.totalPages).toBe(2);
  });
});

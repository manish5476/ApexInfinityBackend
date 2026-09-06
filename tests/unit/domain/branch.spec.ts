import { Branch } from '../../../src/modules/organization/domain/entities/Branch';

describe('Branch Entity', () => {
  const baseParams = {
    id: 'branch-1',
    organizationId: 'org-1',
    name: 'Main HQ',
    branchCode: 'HQ-001',
    isMainBranch: true,
  };

  it('should create a branch with ACTIVE status and main branch flag', () => {
    const branch = Branch.create(baseParams);

    expect(branch.id).toBe('branch-1');
    expect(branch.name).toBe('Main HQ');
    expect(branch.branchCode).toBe('HQ-001');
    expect(branch.isMainBranch).toBe(true);
    expect(branch.isActive).toBe(true);
  });

  it('should reject empty branch name', () => {
    expect(() =>
      Branch.create({
        ...baseParams,
        name: '   ',
      })
    ).toThrow('Branch name cannot be empty.');
  });

  it('should update branch details', () => {
    const branch = Branch.create(baseParams);
    branch.updateDetails({
      name: 'Central HQ',
      phone: '+919876543210',
      address: { city: 'Mumbai', state: 'Maharashtra' },
    });

    expect(branch.name).toBe('Central HQ');
    expect(branch.phone).toBe('+919876543210');
    expect(branch.address?.city).toBe('Mumbai');
  });

  it('should not allow deactivating the main branch', () => {
    const branch = Branch.create(baseParams);
    expect(() => branch.deactivate()).toThrow('Cannot deactivate the main branch.');
  });

  it('should allow deactivating a non-main branch', () => {
    const branch = Branch.create({ ...baseParams, isMainBranch: false });
    branch.deactivate();
    expect(branch.isActive).toBe(false);
  });
});

import { CreateBranchUseCase } from '../../../src/modules/organization/application/use-cases/CreateBranchUseCase';
import { InMemoryBranchRepository } from '../../../src/modules/organization/infrastructure/repositories/InMemoryBranchRepository';

describe('CreateBranchUseCase', () => {
  let branchRepo: InMemoryBranchRepository;
  let useCase: CreateBranchUseCase;

  beforeEach(() => {
    branchRepo = new InMemoryBranchRepository();
    useCase = new CreateBranchUseCase(branchRepo);
  });

  it('should create a branch successfully', async () => {
    const result = await useCase.execute({
      organizationId: 'org-test',
      name: 'Downtown Store',
      branchCode: 'DWT-101',
      isMainBranch: true,
    });

    expect(result.isSuccess).toBe(true);
    const branch = result.getValue();
    expect(branch.name).toBe('Downtown Store');
    expect(branch.branchCode).toBe('DWT-101');
    expect(branch.isMainBranch).toBe(true);

    const saved = await branchRepo.findById({ id: branch.id, organizationId: 'org-test' });
    expect(saved).toBeDefined();
  });

  it('should reject duplicate branch code within the same organization', async () => {
    await useCase.execute({
      organizationId: 'org-test',
      name: 'Branch 1',
      branchCode: 'CODE-1',
    });

    const result = await useCase.execute({
      organizationId: 'org-test',
      name: 'Branch 2',
      branchCode: 'CODE-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain("already exists");
  });
});

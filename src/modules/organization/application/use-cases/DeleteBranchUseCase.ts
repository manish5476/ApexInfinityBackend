import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError, DomainError } from '../../../../shared/errors';

export interface DeleteBranchDto {
  id: string;
  organizationId: string;
}

export class DeleteBranchUseCase implements IUseCase<DeleteBranchDto, boolean> {
  constructor(private readonly branchRepo: IBranchRepository) {}

  async execute(dto: DeleteBranchDto): Promise<Result<boolean>> {
    const branch = await this.branchRepo.findById(dto);
    if (!branch) {
      return Result.fail(new NotFoundError('Branch not found.'));
    }

    if (branch.isMainBranch) {
      return Result.fail(new DomainError('Cannot delete the main branch.'));
    }

    await this.branchRepo.delete(dto);
    return Result.ok(true);
  }
}

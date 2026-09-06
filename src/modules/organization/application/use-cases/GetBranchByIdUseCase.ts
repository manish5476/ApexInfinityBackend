import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { Branch } from '../../domain/entities/Branch';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError } from '../../../../shared/errors';

export interface GetBranchByIdDto {
  id: string;
  organizationId: string;
}

export class GetBranchByIdUseCase implements IUseCase<GetBranchByIdDto, Branch> {
  constructor(private readonly branchRepo: IBranchRepository) {}

  async execute(dto: GetBranchByIdDto): Promise<Result<Branch>> {
    const branch = await this.branchRepo.findById(dto);
    if (!branch) {
      return Result.fail(new NotFoundError('Branch not found.'));
    }
    return Result.ok(branch);
  }
}

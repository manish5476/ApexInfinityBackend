import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { Branch, BranchAddress } from '../../domain/entities/Branch';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError } from '../../../../shared/errors';

export interface UpdateBranchDto {
  id: string;
  organizationId: string;
  name?: string;
  branchCode?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}

export class UpdateBranchUseCase implements IUseCase<UpdateBranchDto, Branch> {
  constructor(private readonly branchRepo: IBranchRepository) {}

  async execute(dto: UpdateBranchDto): Promise<Result<Branch>> {
    const branch = await this.branchRepo.findById({ id: dto.id, organizationId: dto.organizationId });
    if (!branch) {
      return Result.fail(new NotFoundError('Branch not found.'));
    }

    if (dto.isMainBranch) {
      const currentMain = await this.branchRepo.findMainBranch({ organizationId: dto.organizationId });
      if (currentMain && currentMain.id !== branch.id) {
        currentMain.unsetMainBranch();
        await this.branchRepo.save(currentMain);
      }
    }

    branch.updateDetails(dto);
    await this.branchRepo.save(branch);
    return Result.ok(branch);
  }
}

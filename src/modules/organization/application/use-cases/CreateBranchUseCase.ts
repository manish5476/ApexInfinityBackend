import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { Branch, BranchAddress } from '../../domain/entities/Branch';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { ConflictError, ValidationError } from '../../../../shared/errors';
import { randomUUID } from 'crypto';

export interface CreateBranchDto {
  organizationId: string;
  name: string;
  branchCode?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}

export class CreateBranchUseCase implements IUseCase<CreateBranchDto, Branch> {
  constructor(private readonly branchRepo: IBranchRepository) {}

  async execute(dto: CreateBranchDto): Promise<Result<Branch>> {
    if (!dto.name || !dto.name.trim()) {
      return Result.fail(new ValidationError('Branch name is required.'));
    }

    if (dto.branchCode) {
      const existing = await this.branchRepo.findByCode({
        branchCode: dto.branchCode.toUpperCase(),
        organizationId: dto.organizationId,
      });
      if (existing) {
        return Result.fail(new ConflictError(`Branch with code '${dto.branchCode}' already exists in this organization.`));
      }
    }

    // If this branch is set as main branch, unset any existing main branch
    if (dto.isMainBranch) {
      const currentMain = await this.branchRepo.findMainBranch({ organizationId: dto.organizationId });
      if (currentMain) {
        currentMain.unsetMainBranch();
        await this.branchRepo.save(currentMain);
      }
    }

    const branch = Branch.create({
      id: randomUUID(),
      organizationId: dto.organizationId,
      name: dto.name,
      branchCode: dto.branchCode,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      isMainBranch: dto.isMainBranch,
    });

    await this.branchRepo.save(branch);
    return Result.ok(branch);
  }
}

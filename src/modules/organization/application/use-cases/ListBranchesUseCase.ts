import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { Branch } from '../../domain/entities/Branch';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';

export interface ListBranchesDto {
  organizationId: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export class ListBranchesUseCase implements IUseCase<ListBranchesDto, { data: Branch[]; total: number }> {
  constructor(private readonly branchRepo: IBranchRepository) {}

  async execute(dto: ListBranchesDto): Promise<Result<{ data: Branch[]; total: number }>> {
    const result = await this.branchRepo.list(dto);
    return Result.ok(result);
  }
}

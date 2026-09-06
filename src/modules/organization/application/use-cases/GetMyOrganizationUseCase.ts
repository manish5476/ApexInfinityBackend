import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { Organization } from '../../domain/entities/Organization';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError, UnauthorizedError } from '../../../../shared/errors';

export interface GetMyOrganizationDto {
  organizationId?: string;
}

export class GetMyOrganizationUseCase implements IUseCase<GetMyOrganizationDto, Organization> {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(dto: GetMyOrganizationDto): Promise<Result<Organization>> {
    if (!dto.organizationId) {
      return Result.fail(new UnauthorizedError('No active organization in session.'));
    }

    const org = await this.orgRepo.findById(dto.organizationId);
    if (!org) {
      return Result.fail(new NotFoundError('Organization not found.'));
    }

    return Result.ok(org);
  }
}

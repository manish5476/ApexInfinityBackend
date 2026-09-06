import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { Organization, OrganizationAddress, OrganizationSettings } from '../../domain/entities/Organization';
import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError } from '../../../../shared/errors';

export interface UpdateOrganizationDto {
  organizationId: string;
  name?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  uniqueShopId?: string;
  logo?: string;
  address?: OrganizationAddress;
  settings?: OrganizationSettings;
}

export class UpdateOrganizationUseCase implements IUseCase<UpdateOrganizationDto, Organization> {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(dto: UpdateOrganizationDto): Promise<Result<Organization>> {
    const org = await this.orgRepo.findById(dto.organizationId);
    if (!org) {
      return Result.fail(new NotFoundError('Organization not found.'));
    }

    org.updateDetails(dto);
    await this.orgRepo.save(org);

    return Result.ok(org);
  }
}

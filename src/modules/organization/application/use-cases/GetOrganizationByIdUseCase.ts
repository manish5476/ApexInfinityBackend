import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { OrganizationResponseDto } from '../dto/OrganizationResponseDto';
import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { Result } from '../../../../shared/result';
import { NotFoundError } from '../../../../shared/errors';

export class GetOrganizationByIdUseCase implements IUseCase<string, OrganizationResponseDto> {
  private readonly organizationRepo: IOrganizationRepository;
  private readonly mapper: OrganizationMapper;

  constructor(organizationRepo: IOrganizationRepository, mapper: OrganizationMapper) {
    this.organizationRepo = organizationRepo;
    this.mapper = mapper;
  }

  public async execute(
    id: string,
    _context?: IApplicationContext
  ): Promise<Result<OrganizationResponseDto>> {
    try {
      const org = await this.organizationRepo.findById(id);
      if (!org) {
        return Result.fail(new NotFoundError('Organization', id));
      }

      return Result.ok(this.mapper.toDto(org));
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}

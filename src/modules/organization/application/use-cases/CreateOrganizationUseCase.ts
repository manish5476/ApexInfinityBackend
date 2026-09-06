import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { CreateOrganizationDto } from '../dto/CreateOrganizationDto';
import { OrganizationResponseDto } from '../dto/OrganizationResponseDto';
import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { Organization } from '../../domain/entities/Organization';
import { Result } from '../../../../shared/result';
import { ConflictError } from '../../../../shared/errors';

export class CreateOrganizationUseCase
  implements IUseCase<CreateOrganizationDto, OrganizationResponseDto>
{
  private readonly organizationRepo: IOrganizationRepository;
  private readonly mapper: OrganizationMapper;
  private readonly eventBus?: IEventBus;

  constructor(
    organizationRepo: IOrganizationRepository,
    mapper: OrganizationMapper,
    eventBus?: IEventBus
  ) {
    this.organizationRepo = organizationRepo;
    this.mapper = mapper;
    this.eventBus = eventBus;
  }

  public async execute(
    input: CreateOrganizationDto,
    _context?: IApplicationContext
  ): Promise<Result<OrganizationResponseDto>> {
    try {
      // 1. Enforce business rule: slug uniqueness
      const existing = await this.organizationRepo.findBySlug(input.slug);
      if (existing) {
        return Result.fail(
          new ConflictError(`An organization with slug '${input.slug}' already exists.`)
        );
      }

      // 2. Create pure domain entity
      const organization = Organization.create(input.name, input.slug);

      // 3. Persist entity
      const saved = await this.organizationRepo.save(organization);

      // 4. Dispatch domain events
      if (this.eventBus) {
        for (const event of organization.domainEvents) {
          await this.eventBus.publishDomainEvent(event);
        }
        organization.clearDomainEvents();
      }

      // 5. Return mapped response DTO
      return Result.ok(this.mapper.toDto(saved));
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}

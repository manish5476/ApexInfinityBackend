import { CreateOrganizationUseCase } from '../../../src/modules/organization/application/use-cases/CreateOrganizationUseCase';
import { InMemoryOrganizationRepository } from '../../../src/modules/organization/infrastructure/repositories/InMemoryOrganizationRepository';
import { OrganizationMapper } from '../../../src/modules/organization/application/mappers/OrganizationMapper';
import { InMemoryEventBus } from '../../../src/infrastructure/messaging/InMemoryEventBus';
import { ConflictError } from '../../../src/shared/errors';

describe('CreateOrganizationUseCase (Application Layer Test with InMemory Stub)', () => {
  let repo: InMemoryOrganizationRepository;
  let mapper: OrganizationMapper;
  let eventBus: InMemoryEventBus;
  let useCase: CreateOrganizationUseCase;

  beforeEach(() => {
    repo = new InMemoryOrganizationRepository();
    mapper = new OrganizationMapper();
    eventBus = new InMemoryEventBus();
    useCase = new CreateOrganizationUseCase(repo, mapper, eventBus);
  });

  it('should successfully create and persist a new organization, publishing domain event', async () => {
    const publishedEvents: string[] = [];
    eventBus.subscribe('organization.created', (payload) => {
      publishedEvents.push((payload as { slug: string }).slug);
    });

    const result = await useCase.execute({
      name: 'Apex Innovations',
      slug: 'apex-innovations',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.id).toBeDefined();
    expect(dto.name).toBe('Apex Innovations');
    expect(dto.slug).toBe('apex-innovations');
    expect(dto.isActive).toBe(true);

    // Verify entity was saved in repository
    const found = await repo.findById(dto.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Apex Innovations');

    // Verify event was dispatched
    expect(publishedEvents).toContain('apex-innovations');
  });

  it('should reject creating an organization with a duplicate slug', async () => {
    await useCase.execute({
      name: 'First Org',
      slug: 'unique-slug',
    });

    const duplicateResult = await useCase.execute({
      name: 'Second Org',
      slug: 'unique-slug',
    });

    expect(duplicateResult.isFailure).toBe(true);
    expect(duplicateResult.getError()).toBeInstanceOf(ConflictError);
  });
});

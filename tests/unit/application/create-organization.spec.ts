import { CreateOrganizationUseCase } from '../../../src/modules/organization/application/use-cases/CreateOrganizationUseCase';
import { InMemoryOrganizationRepository } from '../../../src/modules/organization/infrastructure/repositories/InMemoryOrganizationRepository';
import { OrganizationMapper } from '../../../src/modules/organization/application/mappers/OrganizationMapper';
import { InMemoryEventBus } from '../../../src/infrastructure/messaging/InMemoryEventBus';
import { ConflictError } from '../../../src/shared/errors';
import { Organization } from '../../../src/modules/organization/domain/entities/Organization';

describe('CreateOrganizationUseCase (Application Layer Test)', () => {
  let repo: InMemoryOrganizationRepository;
  let mapper: OrganizationMapper;
  let eventBus: InMemoryEventBus;
  let useCase: CreateOrganizationUseCase;
  let mockConnection: any;
  let mockPasswordHasher: any;
  let mockTokenService: any;

  beforeEach(() => {
    repo = new InMemoryOrganizationRepository();
    mapper = new OrganizationMapper();
    eventBus = new InMemoryEventBus();

    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    const mockModelInstance = {
      save: jest.fn().mockResolvedValue({}),
      toObject: jest.fn().mockReturnValue({
        _id: 'org-123',
        name: 'Apex Innovations',
        slug: 'apex-innovations',
        uniqueShopId: 'ORG-APEX1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const mockModel = jest.fn().mockImplementation(() => mockModelInstance);

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
      models: {},
      model: jest.fn().mockReturnValue(mockModel),
    };

    mockPasswordHasher = {
      hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      verifyToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    useCase = new CreateOrganizationUseCase(
      mockConnection,
      repo,
      mapper,
      mockPasswordHasher,
      mockTokenService,
      eventBus
    );
  });

  it('should successfully create and persist a new organization with 9-entity setup', async () => {
    const result = await useCase.execute({
      organizationName: 'Apex Innovations',
      slug: 'apex-innovations',
      ownerName: 'Admin Owner',
      ownerEmail: 'owner@apex.test',
      ownerPassword: 'Password123!',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.organization).toBeDefined();
    expect(data.organization.name).toBe('Apex Innovations');
    expect(data.organization.slug).toBe('apex-innovations');
    expect(data.owner).toBeDefined();
    expect(data.owner.email).toBe('owner@apex.test');
    expect(data.accessToken).toBe('mock-access-token');
    expect(data.refreshToken).toBe('mock-refresh-token');
    expect(data.setup.branch).toBeDefined();
    expect(data.setup.role).toBeDefined();
    expect(data.setup.shift).toBeDefined();
    expect(data.setup.department).toBeDefined();
    expect(data.setup.designation).toBeDefined();
  });

  it('should reject creating an organization with a duplicate slug', async () => {
    // Pre-populate repo with an existing org with slug 'unique-slug'
    const existingOrg = Organization.create('First Org', 'unique-slug');
    await repo.save(existingOrg);

    const duplicateResult = await useCase.execute({
      organizationName: 'Second Org',
      slug: 'unique-slug',
      ownerName: 'Second Owner',
      ownerEmail: 'second@apex.test',
      ownerPassword: 'Password123!',
    });

    expect(duplicateResult.isFailure).toBe(true);
    expect(duplicateResult.getError()).toBeInstanceOf(ConflictError);
  });
});

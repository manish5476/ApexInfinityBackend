import { CreateEmployeeUseCase } from '../../../src/modules/hrms/application/use-cases/CreateEmployeeUseCase';
import { InMemoryEmployeeRepository } from '../../../src/modules/hrms/infrastructure/repositories/InMemoryEmployeeRepository';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { EmployeeMapper } from '../../../src/modules/hrms/application/mappers/EmployeeMapper';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { ConflictError, NotFoundError } from '../../../src/shared/errors';
import { IEventBus } from '../../../src/infrastructure/messaging/IEventBus';

describe('CreateEmployeeUseCase (Application Layer Test with In-Memory Stub)', () => {
  let employeeRepo: InMemoryEmployeeRepository;
  let userRepo: InMemoryUserRepository;
  let mapper: EmployeeMapper;
  let mockEventBus: IEventBus;
  let useCase: CreateEmployeeUseCase;

  beforeEach(() => {
    employeeRepo = new InMemoryEmployeeRepository();
    userRepo = new InMemoryUserRepository();
    mapper = new EmployeeMapper();

    mockEventBus = {
      publish: jest.fn(),
      publishDomainEvent: jest.fn(),
      subscribe: jest.fn(),
    };

    useCase = new CreateEmployeeUseCase(employeeRepo, mapper, userRepo, mockEventBus);
  });

  it('should create employee successfully within tenant organization', async () => {
    const result = await useCase.execute(
      {
        employeeCode: 'EMP-101',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah.connor@apexinfinity.com',
        workMode: 'on_site',
      },
      {
        organizationId: 'org-tenant-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        roles: ['hr_admin'],
        permissions: [],
      }
    );

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.employeeCode).toBe('EMP-101');
    expect(dto.fullName).toBe('Sarah Connor');
    expect(dto.organizationId).toBe('org-tenant-1');

    // Verify persisted
    const saved = await employeeRepo.findByCode('org-tenant-1', 'EMP-101');
    expect(saved).not.toBeNull();
    expect(saved!.fullName).toBe('Sarah Connor');

    // Verify event bus called
    expect(mockEventBus.publishDomainEvent).toHaveBeenCalled();
  });

  it('should reject duplicate employeeCode within the same organization with ConflictError', async () => {
    await useCase.execute(
      {
        employeeCode: 'EMP-101',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah.connor@apexinfinity.com',
      },
      {
        organizationId: 'org-tenant-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        roles: ['hr_admin'],
        permissions: [],
      }
    );

    const duplicateResult = await useCase.execute(
      {
        employeeCode: 'EMP-101',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@apexinfinity.com',
      },
      {
        organizationId: 'org-tenant-1',
        requestId: 'req-2',
        correlationId: 'corr-2',
        roles: ['hr_admin'],
        permissions: [],
      }
    );

    expect(duplicateResult.isFailure).toBe(true);
    expect(duplicateResult.getError()).toBeInstanceOf(ConflictError);
  });

  it('should link valid user identity when userId is provided', async () => {
    // Seed user in userRepo
    const user = User.create({
      email: 'john.reese@apexinfinity.com',
      passwordHash: 'hashed_pwd',
      name: 'John Reese',
      organizationId: 'org-tenant-1',
    });
    await userRepo.save(user);

    const result = await useCase.execute(
      {
        employeeCode: 'EMP-102',
        userId: user.id,
        firstName: 'John',
        lastName: 'Reese',
        email: 'john.reese@apexinfinity.com',
      },
      {
        organizationId: 'org-tenant-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        roles: ['hr_admin'],
        permissions: [],
      }
    );

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().userId).toBe(user.id);
  });

  it('should reject linking nonexistent user with NotFoundError', async () => {
    const result = await useCase.execute(
      {
        employeeCode: 'EMP-103',
        userId: 'non-existent-user-id',
        firstName: 'Ghost',
        lastName: 'User',
        email: 'ghost@apexinfinity.com',
      },
      {
        organizationId: 'org-tenant-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        roles: ['hr_admin'],
        permissions: [],
      }
    );

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(NotFoundError);
  });
});

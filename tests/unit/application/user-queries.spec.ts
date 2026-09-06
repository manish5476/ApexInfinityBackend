import { GetUserByIdUseCase } from '../../../src/modules/auth/application/use-cases/GetUserByIdUseCase';
import { ListUsersUseCase } from '../../../src/modules/auth/application/use-cases/ListUsersUseCase';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { UserMapper } from '../../../src/modules/auth/application/mappers/UserMapper';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { NotFoundError } from '../../../src/shared/errors';

describe('User Query Use Cases (GetUserByIdUseCase & ListUsersUseCase)', () => {
  let userRepo: InMemoryUserRepository;
  let mapper: UserMapper;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let listUsersUseCase: ListUsersUseCase;
  let seededUser1: User;
  let seededUser2: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    mapper = new UserMapper();

    seededUser1 = User.create({
      email: 'john.doe@apexinfinity.com',
      passwordHash: 'hashed_pwd_1',
      name: 'John Doe',
      organizationId: 'org-tenant-1',
      roles: ['user'],
    });

    seededUser2 = User.create({
      email: 'jane.smith@apexinfinity.com',
      passwordHash: 'hashed_pwd_2',
      name: 'Jane Smith',
      organizationId: 'org-tenant-2',
      roles: ['admin'],
    });

    await userRepo.save(seededUser1);
    await userRepo.save(seededUser2);

    getUserByIdUseCase = new GetUserByIdUseCase(userRepo, mapper);
    listUsersUseCase = new ListUsersUseCase(userRepo, mapper);
  });

  describe('GetUserByIdUseCase', () => {
    it('should return user DTO if user exists and organization matches', async () => {
      const result = await getUserByIdUseCase.execute({
        userId: seededUser1.id,
        organizationId: 'org-tenant-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe(seededUser1.id);
      expect(result.getValue().name).toBe('John Doe');
    });

    it('should return NotFoundError if user belongs to a different organization', async () => {
      const result = await getUserByIdUseCase.execute({
        userId: seededUser1.id,
        organizationId: 'org-tenant-2',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFoundError);
    });

    it('should return NotFoundError if user does not exist', async () => {
      const result = await getUserByIdUseCase.execute({
        userId: 'non-existent',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFoundError);
    });
  });

  describe('ListUsersUseCase', () => {
    it('should filter users by organizationId', async () => {
      const result = await listUsersUseCase.execute({
        organizationId: 'org-tenant-1',
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.total).toBe(1);
      expect(data.items[0]!.id).toBe(seededUser1.id);
    });

    it('should paginate results', async () => {
      const result = await listUsersUseCase.execute({
        pagination: { page: 1, limit: 1 },
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.items.length).toBe(1);
      expect(data.total).toBe(2);
      expect(data.totalPages).toBe(2);
    });
  });
});

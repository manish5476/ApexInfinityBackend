import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { UserResponseDto } from '../dto/AuthResultDto';
import { UserMapper } from '../mappers/UserMapper';
import { PaginatedResult, PaginationParams } from '../../../../shared/pagination';

export interface ListUsersInput {
  organizationId?: string;
  isActive?: boolean;
  search?: string;
  pagination?: PaginationParams;
}

export class ListUsersUseCase implements IUseCase<ListUsersInput, PaginatedResult<UserResponseDto>> {
  private readonly userRepo: IUserRepository;
  private readonly mapper: UserMapper;

  constructor(userRepo: IUserRepository, mapper: UserMapper) {
    this.userRepo = userRepo;
    this.mapper = mapper;
  }

  public async execute(input: ListUsersInput): Promise<Result<PaginatedResult<UserResponseDto>, never>> {
    const paginatedUsers = await this.userRepo.find({
      filter: {
        organizationId: input.organizationId,
        isActive: input.isActive,
        search: input.search,
      },
      pagination: input.pagination,
    });

    const dtos = paginatedUsers.items.map((user) => this.mapper.toDto(user));

    return Result.ok({
      ...paginatedUsers,
      items: dtos,
    });
  }
}

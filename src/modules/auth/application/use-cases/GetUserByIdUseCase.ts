import { IUseCase } from '../../../../core/application/IUseCase';
import { Result } from '../../../../shared/result';
import { NotFoundError } from '../../../../shared/errors';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { UserResponseDto } from '../dto/AuthResultDto';
import { UserMapper } from '../mappers/UserMapper';

export interface GetUserByIdInput {
  userId: string;
  organizationId?: string;
}

export class GetUserByIdUseCase implements IUseCase<GetUserByIdInput, UserResponseDto> {
  private readonly userRepo: IUserRepository;
  private readonly mapper: UserMapper;

  constructor(userRepo: IUserRepository, mapper: UserMapper) {
    this.userRepo = userRepo;
    this.mapper = mapper;
  }

  public async execute(input: GetUserByIdInput): Promise<Result<UserResponseDto, NotFoundError>> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return Result.fail(new NotFoundError('User', input.userId));
    }

    if (input.organizationId && user.organizationId !== input.organizationId) {
      return Result.fail(new NotFoundError('User', input.userId));
    }

    return Result.ok(this.mapper.toDto(user));
  }
}

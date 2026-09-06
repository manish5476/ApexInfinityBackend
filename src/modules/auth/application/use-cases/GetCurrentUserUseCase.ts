import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { UserResponseDto } from '../dto/AuthResultDto';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { UserMapper } from '../mappers/UserMapper';
import { Result } from '../../../../shared/result';
import { NotFoundError, UnauthorizedError } from '../../../../shared/errors';

export class GetCurrentUserUseCase implements IUseCase<void, UserResponseDto> {
  private readonly userRepo: IUserRepository;
  private readonly mapper: UserMapper;

  constructor(userRepo: IUserRepository, mapper: UserMapper) {
    this.userRepo = userRepo;
    this.mapper = mapper;
  }

  public async execute(
    _input: void,
    context?: IApplicationContext
  ): Promise<Result<UserResponseDto>> {
    try {
      if (!context?.userId) {
        return Result.fail(new UnauthorizedError('Authenticated context is missing.'));
      }

      const user = await this.userRepo.findById(context.userId);
      if (!user) {
        return Result.fail(new NotFoundError('User', context.userId));
      }

      return Result.ok(this.mapper.toDto(user));
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}

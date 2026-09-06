import { User } from '../entities/User';
import { IRepository } from '../../../../core/domain/IRepository';
import { PaginatedResult, PaginationParams } from '../../../../shared/pagination';

export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: string): Promise<User | null>;
  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null>;
  find(options?: {
    filter?: { organizationId?: string; isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<User>>;
}

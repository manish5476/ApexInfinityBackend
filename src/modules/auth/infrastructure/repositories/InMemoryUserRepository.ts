import { IUserRepository } from '../../domain/ports/IUserRepository';
import { User } from '../../domain/entities/User';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class InMemoryUserRepository implements IUserRepository {
  private readonly items: Map<string, User> = new Map();

  public async findById(id: string): Promise<User | null> {
    return this.items.get(id) || null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const target = email.toLowerCase().trim();
    for (const user of this.items.values()) {
      if (user.email.value === target) {
        return user;
      }
    }
    return null;
  }

  public async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    for (const user of this.items.values()) {
      if (user.passwordResetTokenHash === tokenHash) {
        return user;
      }
    }
    return null;
  }

  public async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
    for (const user of this.items.values()) {
      if (user.emailVerificationTokenHash === tokenHash) {
        return user;
      }
    }
    return null;
  }

  public async save(entity: User): Promise<User> {
    this.items.set(entity.id, entity);
    return entity;
  }

  public async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  public async find(options?: {
    filter?: { organizationId?: string; isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<User>> {
    let list = Array.from(this.items.values());

    if (options?.filter?.organizationId) {
      list = list.filter((u) => u.organizationId === options.filter!.organizationId);
    }
    if (options?.filter?.isActive !== undefined) {
      list = list.filter((u) => u.isActive === options.filter!.isActive);
    }
    if (options?.filter?.search) {
      const q = options.filter.search.toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.value.includes(q)
      );
    }

    const pagination = options?.pagination || { page: 1, limit: 20 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = list.slice(startIndex, startIndex + pagination.limit);

    return PaginationHelper.createResult(paginatedItems, list.length, pagination);
  }

  public clear(): void {
    this.items.clear();
  }
}

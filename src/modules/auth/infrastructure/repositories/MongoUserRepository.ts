import { Model, FilterQuery } from 'mongoose';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserDocument } from '../persistence/user.model';
import { UserMapper } from '../../application/mappers/UserMapper';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class MongoUserRepository implements IUserRepository {
  private readonly model: Model<UserDocument>;
  private readonly mapper: UserMapper;

  constructor(model: Model<UserDocument>, mapper: UserMapper) {
    this.model = model;
    this.mapper = mapper;
  }

  public async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    const doc = await this.model.findOne({ passwordResetTokenHash: tokenHash }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
    const doc = await this.model.findOne({ emailVerificationTokenHash: tokenHash }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async save(entity: User): Promise<User> {
    const raw = this.mapper.toPersistence(entity);
    const unset: Record<string, 1> = {};
    if (!raw.passwordResetTokenHash) unset.passwordResetTokenHash = 1;
    if (!raw.passwordResetExpires) unset.passwordResetExpires = 1;
    if (!raw.emailVerificationTokenHash) unset.emailVerificationTokenHash = 1;
    if (!raw.emailVerificationExpires) unset.emailVerificationExpires = 1;

    const update: Record<string, unknown> = { $set: raw };
    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
      const mutable = raw as unknown as Record<string, unknown>;
      for (const key of Object.keys(unset)) {
        delete mutable[key];
      }
    }

    const doc = await this.model.findByIdAndUpdate(
      entity.id,
      update,
      { upsert: true, new: true, runValidators: true }
    ).exec();

    return this.mapper.toDomain(doc!);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }

  public async find(options?: {
    filter?: { organizationId?: string; isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<User>> {
    const pagination = options?.pagination || { page: 1, limit: 20 };
    const skip = (pagination.page - 1) * pagination.limit;

    const mongoFilter: FilterQuery<UserDocument> = {};
    if (options?.filter?.organizationId) {
      mongoFilter.organizationId = options.filter.organizationId;
    }
    if (options?.filter?.isActive !== undefined) {
      mongoFilter.isActive = options.filter.isActive;
    }
    if (options?.filter?.search) {
      mongoFilter.$text = { $search: options.filter.search };
    }

    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(pagination.limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    const items = docs.map((doc) => this.mapper.toDomain(doc));
    return PaginationHelper.createResult(items, total, pagination);
  }
}

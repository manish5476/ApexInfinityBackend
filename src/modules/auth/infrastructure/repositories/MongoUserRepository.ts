import mongoose, { Model, FilterQuery } from 'mongoose';
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
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjId
      ? { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] }
      : { _id: id };
    const doc = await this.model.findOne(filter).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByEmail(email: string, organizationId?: string): Promise<User | null> {
    const query: any = { email: email.trim().toLowerCase() };
    if (organizationId) {
      const isObjId = mongoose.Types.ObjectId.isValid(organizationId);
      query.organizationId = isObjId
        ? { $in: [organizationId, new mongoose.Types.ObjectId(organizationId)] }
        : organizationId;
    }
    const doc = await this.model.findOne(query).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByEmailOrPhone(identifier: string, organizationId?: string): Promise<User | null> {
    const trimmed = identifier.trim();
    const emailLower = trimmed.toLowerCase();
    const phoneCleaned = trimmed.replace(/[\s\-\(\)\+]/g, '');

    const orClauses: any[] = [{ email: emailLower }];
    if (phoneCleaned.length >= 7) {
      orClauses.push({ phone: phoneCleaned });
      orClauses.push({ phone: trimmed });
    }

    const query: any = { $or: orClauses };

    if (organizationId) {
      const isObjId = mongoose.Types.ObjectId.isValid(organizationId);
      query.organizationId = isObjId
        ? { $in: [organizationId, new mongoose.Types.ObjectId(organizationId)] }
        : organizationId;
    }

    const doc = await this.model.findOne(query).exec();
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
    const isObjId = mongoose.Types.ObjectId.isValid(entity.id);
    const filter = isObjId
      ? { $or: [{ _id: entity.id }, { _id: new mongoose.Types.ObjectId(entity.id) }] }
      : { _id: entity.id };

    const rawData = { ...raw } as Record<string, unknown>;
    delete rawData._id;

    const unset: Record<string, 1> = {};
    if (!raw.passwordResetTokenHash) unset.passwordResetTokenHash = 1;
    if (!raw.passwordResetExpires) unset.passwordResetExpires = 1;
    if (!raw.emailVerificationTokenHash) unset.emailVerificationTokenHash = 1;
    if (!raw.emailVerificationExpires) unset.emailVerificationExpires = 1;

    const update: Record<string, unknown> = {
      $set: rawData,
      $setOnInsert: { _id: isObjId ? new mongoose.Types.ObjectId(entity.id) : entity.id },
    };
    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
      for (const key of Object.keys(unset)) {
        delete rawData[key];
      }
    }

    const doc = await this.model.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true, runValidators: false }
    ).exec();

    return this.mapper.toDomain(doc!);
  }

  public async delete(id: string): Promise<boolean> {
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjId
      ? { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] }
      : { _id: id };
    const result = await this.model.deleteOne(filter).exec();
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
      const orgId = options.filter.organizationId;
      const isObjId = mongoose.Types.ObjectId.isValid(orgId);
      mongoFilter.organizationId = isObjId
        ? { $in: [orgId, new mongoose.Types.ObjectId(orgId)] }
        : orgId;
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

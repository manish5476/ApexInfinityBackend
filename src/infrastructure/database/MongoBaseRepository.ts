import { Model, Document, FilterQuery } from 'mongoose';
import { Entity } from '../../core/domain/Entity';
import { ITenantRepository, TenantScopedId, TenantQueryCriteria } from '../../core/domain/IRepository';
import { IMapper } from '../../core/application/IMapper';
import { PaginatedResult, PaginationHelper } from '../../shared/pagination';

export abstract class MongoBaseRepository<
  TEntity extends Entity<string>,
  TDoc = any
> implements ITenantRepository<TEntity, string> {
  protected readonly model: Model<TDoc>;
  protected readonly mapper: IMapper<TEntity, any, any>;
  protected readonly allowedSortFields: readonly string[];

  constructor(
    model: Model<TDoc>,
    mapper: IMapper<TEntity, any, any>,
    allowedSortFields: readonly string[] = ['createdAt', 'updatedAt']
  ) {
    this.model = model;
    this.mapper = mapper;
    this.allowedSortFields = allowedSortFields;
  }

  public async findById(scope: TenantScopedId<string>): Promise<TEntity | null> {
    const filter = {
      _id: scope.id,
      organizationId: scope.organizationId,
    } as FilterQuery<TDoc>;

    const doc = await this.model.findOne(filter).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async find(query: TenantQueryCriteria): Promise<PaginatedResult<TEntity>> {
    const pagination = query.pagination || { page: 1, limit: 20 };
    const skip = (pagination.page - 1) * pagination.limit;

    // Enforce tenant scoping: organizationId is non-negotiable
    const filter: FilterQuery<TDoc> = {
      organizationId: query.organizationId,
      ...(query.filter || {}),
    } as FilterQuery<TDoc>;

    const sortField = PaginationHelper.validateSortField(
      this.allowedSortFields,
      query.sort?.field
    );
    const sortDirection: 1 | -1 =
      query.sort?.direction === 'desc' || query.sort?.direction === -1 ? -1 : 1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [docs, total] = await Promise.all([
      this.model.find(filter).sort(sortOptions as Record<string, 1 | -1>).skip(skip).limit(pagination.limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const items = docs.map((doc) => this.mapper.toDomain(doc));
    return PaginationHelper.createResult(items, total, pagination);
  }

  public async save(entity: TEntity): Promise<TEntity> {
    if (!this.mapper.toPersistence) {
      throw new Error(`Mapper for ${this.model.modelName} does not implement toPersistence()`);
    }

    const raw = this.mapper.toPersistence(entity);
    const doc = await this.model.findByIdAndUpdate(
      entity.id,
      { $set: raw },
      { upsert: true, new: true, runValidators: true }
    ).exec();

    return this.mapper.toDomain(doc!);
  }

  public async delete(scope: TenantScopedId<string>): Promise<boolean> {
    const filter = {
      _id: scope.id,
      organizationId: scope.organizationId,
    } as FilterQuery<TDoc>;

    const result = await this.model.deleteOne(filter).exec();
    return (result.deletedCount ?? 0) > 0;
  }

  public async exists(scope: TenantScopedId<string>): Promise<boolean> {
    const filter = {
      _id: scope.id,
      organizationId: scope.organizationId,
    } as FilterQuery<TDoc>;

    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }
}

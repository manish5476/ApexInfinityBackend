import { Model, FilterQuery } from 'mongoose';
import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { Organization } from '../../domain/entities/Organization';
import { OrganizationDocument } from '../persistence/organization.model';
import { OrganizationMapper } from '../../application/mappers/OrganizationMapper';
import { PaginatedResult, PaginationParams, PaginationHelper } from '../../../../shared/pagination';

export class MongoOrganizationRepository implements IOrganizationRepository {
  private readonly model: Model<OrganizationDocument>;
  private readonly mapper: OrganizationMapper;

  constructor(model: Model<OrganizationDocument>, mapper: OrganizationMapper) {
    this.model = model;
    this.mapper = mapper;
  }

  public async findById(id: string): Promise<Organization | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findBySlug(slug: string): Promise<Organization | null> {
    const doc = await this.model.findOne({ slug: slug.toLowerCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByShopId(shopId: string): Promise<Organization | null> {
    const doc = await this.model.findOne({ uniqueShopId: shopId.toLowerCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async save(entity: Organization): Promise<Organization> {
    const raw = this.mapper.toPersistence(entity);
    const doc = await this.model.findByIdAndUpdate(
      entity.id,
      { $set: raw },
      { upsert: true, new: true, runValidators: true }
    ).exec();

    return this.mapper.toDomain(doc!);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }

  public async find(options?: {
    filter?: { isActive?: boolean; search?: string };
    pagination?: PaginationParams;
  }): Promise<PaginatedResult<Organization>> {
    const pagination = options?.pagination || { page: 1, limit: 20 };
    const skip = (pagination.page - 1) * pagination.limit;

    const mongoFilter: FilterQuery<OrganizationDocument> = {};
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

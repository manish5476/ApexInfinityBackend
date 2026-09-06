import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IDepartmentRepository } from '../../domain/ports/IDepartmentRepository';
import { Department } from '../../domain/entities/Department';
import { DepartmentDocument } from '../persistence/department.model';
import { DepartmentMapper } from '../../application/mappers/DepartmentMapper';

export class MongoDepartmentRepository
  extends MongoBaseRepository<Department, DepartmentDocument>
  implements IDepartmentRepository
{
  constructor(model: Model<DepartmentDocument>, mapper: DepartmentMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'code']);
  }

  public async findByCode(organizationId: string, code: string): Promise<Department | null> {
    const doc = await this.model
      .findOne({ organizationId, code: code.toUpperCase() })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByParentId(organizationId: string, parentId?: string): Promise<Department[]> {
    const filter = parentId
      ? { organizationId, parentId }
      : { organizationId, parentId: { $exists: false } };

    const docs = await this.model.find(filter).sort({ name: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Department[]> {
    const query: any = { organizationId };
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { code: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const docs = await this.model.find(query).sort({ name: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}


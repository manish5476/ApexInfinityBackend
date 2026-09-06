import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IDesignationRepository } from '../../domain/ports/IDesignationRepository';
import { Designation } from '../../domain/entities/Designation';
import { DesignationDocument } from '../persistence/designation.model';
import { DesignationMapper } from '../../application/mappers/DesignationMapper';

export class MongoDesignationRepository
  extends MongoBaseRepository<Designation, DesignationDocument>
  implements IDesignationRepository
{
  constructor(model: Model<DesignationDocument>, mapper: DesignationMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'title', 'code', 'level']);
  }

  public async findByCode(organizationId: string, code: string): Promise<Designation | null> {
    const doc = await this.model.findOne({ organizationId, code: code.toUpperCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByDepartmentId(organizationId: string, departmentId: string): Promise<Designation[]> {
    const docs = await this.model.find({ organizationId, departmentId }).sort({ level: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { departmentId?: string; isActive?: boolean; search?: string }): Promise<Designation[]> {
    const query: any = { organizationId };
    if (filter?.departmentId) query.departmentId = filter.departmentId;
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    if (filter?.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { code: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const docs = await this.model.find(query).sort({ level: 1, title: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

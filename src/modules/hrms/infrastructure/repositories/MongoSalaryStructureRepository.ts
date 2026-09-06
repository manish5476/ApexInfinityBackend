import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { ISalaryStructureRepository } from '../../domain/ports/ISalaryStructureRepository';
import { SalaryStructure } from '../../domain/entities/SalaryStructure';
import { SalaryStructureDocument } from '../persistence/salary-structure.model';
import { SalaryStructureMapper } from '../../application/mappers/SalaryStructureMapper';

export class MongoSalaryStructureRepository
  extends MongoBaseRepository<SalaryStructure, SalaryStructureDocument>
  implements ISalaryStructureRepository
{
  constructor(model: Model<SalaryStructureDocument>, mapper: SalaryStructureMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'title', 'status', 'effectiveFrom']);
  }

  public async findByUser(organizationId: string, userId: string): Promise<SalaryStructure | null> {
    const doc = await this.model
      .findOne({ organizationId, userId, status: 'active' })
      .sort({ effectiveFrom: -1 })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { status?: string; search?: string }): Promise<SalaryStructure[]> {
    const query: any = { organizationId };
    if (filter?.status) query.status = filter.status;
    if (filter?.search) query.title = { $regex: filter.search, $options: 'i' };
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

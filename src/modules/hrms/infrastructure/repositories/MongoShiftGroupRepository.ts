import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IShiftGroupRepository } from '../../domain/ports/IShiftGroupRepository';
import { ShiftGroup } from '../../domain/entities/ShiftGroup';
import { ShiftGroupDocument } from '../persistence/shift-group.model';
import { ShiftGroupMapper } from '../../application/mappers/ShiftGroupMapper';

export class MongoShiftGroupRepository
  extends MongoBaseRepository<ShiftGroup, ShiftGroupDocument>
  implements IShiftGroupRepository
{
  constructor(model: Model<ShiftGroupDocument>, mapper: ShiftGroupMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'code']);
  }

  public async findByCode(organizationId: string, code: string): Promise<ShiftGroup | null> {
    const doc = await this.model.findOne({ organizationId, code: code.toUpperCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<ShiftGroup[]> {
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

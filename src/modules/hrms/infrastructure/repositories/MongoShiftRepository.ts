import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IShiftRepository } from '../../domain/ports/IShiftRepository';
import { Shift } from '../../domain/entities/Shift';
import { ShiftDocument } from '../persistence/shift.model';
import { ShiftMapper } from '../../application/mappers/ShiftMapper';

export class MongoShiftRepository
  extends MongoBaseRepository<Shift, ShiftDocument>
  implements IShiftRepository
{
  constructor(model: Model<ShiftDocument>, mapper: ShiftMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'code']);
  }

  public async findByCode(organizationId: string, code: string): Promise<Shift | null> {
    const doc = await this.model
      .findOne({ organizationId, code: code.toUpperCase() })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Shift[]> {
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


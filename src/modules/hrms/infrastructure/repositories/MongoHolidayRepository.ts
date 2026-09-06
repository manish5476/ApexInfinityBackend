import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IHolidayRepository } from '../../domain/ports/IHolidayRepository';
import { Holiday } from '../../domain/entities/Holiday';
import { HolidayDocument } from '../persistence/holiday.model';
import { HolidayMapper } from '../../application/mappers/HolidayMapper';

export class MongoHolidayRepository
  extends MongoBaseRepository<Holiday, HolidayDocument>
  implements IHolidayRepository
{
  constructor(model: Model<HolidayDocument>, mapper: HolidayMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'date', 'year']);
  }

  public async findByYear(organizationId: string, year: number, branchId?: string): Promise<Holiday[]> {
    const query: any = { organizationId, year };
    if (branchId) query.$or = [{ branchId }, { branchId: { $exists: false } }, { branchId: null }];
    const docs = await this.model.find(query).sort({ date: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findByDate(organizationId: string, date: Date, branchId?: string): Promise<Holiday | null> {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const query: any = { organizationId, date: d };
    if (branchId) query.$or = [{ branchId }, { branchId: { $exists: false } }, { branchId: null }];
    const doc = await this.model.findOne(query).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { year?: number; branchId?: string; isActive?: boolean }): Promise<Holiday[]> {
    const query: any = { organizationId };
    if (filter?.year) query.year = filter.year;
    if (filter?.branchId) query.branchId = filter.branchId;
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    const docs = await this.model.find(query).sort({ date: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async saveMany(holidays: Holiday[]): Promise<void> {
    if (holidays.length === 0) return;
    const docs = holidays.map((h) => (this.mapper.toPersistence ? this.mapper.toPersistence(h) : (h as any)));
    await this.model.insertMany(docs);
  }
}

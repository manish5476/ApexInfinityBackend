import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IAttendanceDailyRepository } from '../../domain/ports/IAttendanceDailyRepository';
import { AttendanceDaily } from '../../domain/entities/AttendanceDaily';
import { AttendanceDailyDocument } from '../persistence/attendance-daily.model';
import { AttendanceMapper } from '../../application/mappers/AttendanceMapper';

export class MongoAttendanceDailyRepository
  extends MongoBaseRepository<AttendanceDaily, AttendanceDailyDocument>
  implements IAttendanceDailyRepository
{
  constructor(model: Model<AttendanceDailyDocument>, mapper: AttendanceMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'date', 'status', 'totalWorkHours']);
  }

  public async findByEmployeeAndDate(
    organizationId: string,
    employeeId: string,
    date: Date
  ): Promise<AttendanceDaily | null> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const doc = await this.model
      .findOne({ organizationId, employeeId, date: dayStart })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { employeeId?: string; date?: Date; from?: Date; to?: Date; status?: string }): Promise<AttendanceDaily[]> {
    const query: any = { organizationId };
    if (filter?.employeeId) query.employeeId = filter.employeeId;
    if (filter?.status) query.status = filter.status;
    if (filter?.date) {
      const d = new Date(filter.date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    } else if (filter?.from || filter?.to) {
      query.date = {};
      if (filter.from) query.date.$gte = filter.from;
      if (filter.to) query.date.$lte = filter.to;
    }
    const docs = await this.model.find(query).sort({ date: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}


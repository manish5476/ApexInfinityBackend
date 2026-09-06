import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IAttendanceLogRepository } from '../../domain/ports/IAttendanceLogRepository';
import { AttendanceLog } from '../../domain/entities/AttendanceLog';
import { AttendanceLogDocument } from '../persistence/attendance-log.model';
import { AttendanceLogMapper } from '../../application/mappers/AttendanceLogMapper';

export class MongoAttendanceLogRepository
  extends MongoBaseRepository<AttendanceLog, AttendanceLogDocument>
  implements IAttendanceLogRepository
{
  constructor(model: Model<AttendanceLogDocument>, mapper: AttendanceLogMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'timestamp', 'userId', 'type']);
  }

  public async findByUser(organizationId: string, userId: string, from?: Date, to?: Date): Promise<AttendanceLog[]> {
    const query: any = { organizationId, userId };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = from;
      if (to) query.timestamp.$lte = to;
    }
    const docs = await this.model.find(query).sort({ timestamp: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; machineId?: string; from?: Date; to?: Date; isFlagged?: boolean }): Promise<AttendanceLog[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.machineId) query.machineId = filter.machineId;
    if (filter?.isFlagged !== undefined) query.isFlagged = filter.isFlagged;
    if (filter?.from || filter?.to) {
      query.timestamp = {};
      if (filter.from) query.timestamp.$gte = filter.from;
      if (filter.to) query.timestamp.$lte = filter.to;
    }
    const docs = await this.model.find(query).sort({ timestamp: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async saveMany(logs: AttendanceLog[]): Promise<void> {
    if (logs.length === 0) return;
    const docs = logs.map((l) => (this.mapper.toPersistence ? this.mapper.toPersistence(l) : (l as any)));
    await this.model.insertMany(docs);
  }
}

import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IAttendanceMachineRepository } from '../../domain/ports/IAttendanceMachineRepository';
import { AttendanceMachine } from '../../domain/entities/AttendanceMachine';
import { AttendanceMachineDocument } from '../persistence/attendance-machine.model';
import { AttendanceMachineMapper } from '../../application/mappers/AttendanceMachineMapper';

export class MongoAttendanceMachineRepository
  extends MongoBaseRepository<AttendanceMachine, AttendanceMachineDocument>
  implements IAttendanceMachineRepository
{
  constructor(model: Model<AttendanceMachineDocument>, mapper: AttendanceMachineMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'serialNumber', 'status']);
  }

  public async findBySerialNumber(organizationId: string, serialNumber: string): Promise<AttendanceMachine | null> {
    const doc = await this.model.findOne({ organizationId, serialNumber }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByApiKey(apiKey: string): Promise<AttendanceMachine | null> {
    const doc = await this.model.findOne({ apiKey }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { status?: string; branchId?: string }): Promise<AttendanceMachine[]> {
    const query: any = { organizationId };
    if (filter?.status) query.status = filter.status;
    if (filter?.branchId) query.branchId = filter.branchId;
    const docs = await this.model.find(query).sort({ name: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

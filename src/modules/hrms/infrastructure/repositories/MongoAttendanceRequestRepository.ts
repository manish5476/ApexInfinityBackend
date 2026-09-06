import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IAttendanceRequestRepository } from '../../domain/ports/IAttendanceRequestRepository';
import { AttendanceRequest } from '../../domain/entities/AttendanceRequest';
import { AttendanceRequestDocument } from '../persistence/attendance-request.model';
import { AttendanceRequestMapper } from '../../application/mappers/AttendanceRequestMapper';

export class MongoAttendanceRequestRepository
  extends MongoBaseRepository<AttendanceRequest, AttendanceRequestDocument>
  implements IAttendanceRequestRepository
{
  constructor(model: Model<AttendanceRequestDocument>, mapper: AttendanceRequestMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'date', 'type', 'status']);
  }

  public async findByUser(organizationId: string, userId: string): Promise<AttendanceRequest[]> {
    const docs = await this.model.find({ organizationId, userId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findByApprover(organizationId: string, approverId: string, status?: string): Promise<AttendanceRequest[]> {
    const query: any = { organizationId, assignedApprover: approverId };
    if (status) query.status = status;
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string }): Promise<AttendanceRequest[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.approverId) query.assignedApprover = filter.approverId;
    if (filter?.status) query.status = filter.status;
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

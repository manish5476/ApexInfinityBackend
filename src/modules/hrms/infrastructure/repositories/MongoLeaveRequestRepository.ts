import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { ILeaveRequestRepository } from '../../domain/ports/ILeaveRequestRepository';
import { LeaveRequest } from '../../domain/entities/LeaveRequest';
import { LeaveRequestDocument } from '../persistence/leave-request.model';
import { LeaveRequestMapper } from '../../application/mappers/LeaveRequestMapper';

export class MongoLeaveRequestRepository
  extends MongoBaseRepository<LeaveRequest, LeaveRequestDocument>
  implements ILeaveRequestRepository
{
  constructor(model: Model<LeaveRequestDocument>, mapper: LeaveRequestMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'startDate', 'endDate', 'status', 'leaveType']);
  }

  public async findByUser(organizationId: string, userId: string): Promise<LeaveRequest[]> {
    const docs = await this.model.find({ organizationId, userId }).sort({ startDate: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findByApprover(organizationId: string, approverId: string, status?: string): Promise<LeaveRequest[]> {
    const query: any = { organizationId, assignedApprover: approverId };
    if (status) query.status = status;
    const docs = await this.model.find(query).sort({ startDate: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string; departmentId?: string; from?: Date; to?: Date }): Promise<LeaveRequest[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.approverId) query.assignedApprover = filter.approverId;
    if (filter?.status) query.status = filter.status;
    if (filter?.departmentId) query.departmentId = filter.departmentId;
    if (filter?.from || filter?.to) {
      query.startDate = {};
      if (filter.from) query.startDate.$gte = filter.from;
      if (filter.to) query.startDate.$lte = filter.to;
    }
    const docs = await this.model.find(query).sort({ startDate: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

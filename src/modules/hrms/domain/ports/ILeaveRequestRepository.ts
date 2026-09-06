import { ITenantRepository } from '../../../../core/domain/IRepository';
import { LeaveRequest } from '../entities/LeaveRequest';

export interface ILeaveRequestRepository extends ITenantRepository<LeaveRequest, string> {
  findByUser(organizationId: string, userId: string): Promise<LeaveRequest[]>;
  findByApprover(organizationId: string, approverId: string, status?: string): Promise<LeaveRequest[]>;
  findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string; departmentId?: string; from?: Date; to?: Date }): Promise<LeaveRequest[]>;
}

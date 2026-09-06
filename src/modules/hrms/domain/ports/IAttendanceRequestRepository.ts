import { ITenantRepository } from '../../../../core/domain/IRepository';
import { AttendanceRequest } from '../entities/AttendanceRequest';

export interface IAttendanceRequestRepository extends ITenantRepository<AttendanceRequest, string> {
  findByUser(organizationId: string, userId: string): Promise<AttendanceRequest[]>;
  findByApprover(organizationId: string, approverId: string, status?: string): Promise<AttendanceRequest[]>;
  findAll(organizationId: string, filter?: { userId?: string; approverId?: string; status?: string }): Promise<AttendanceRequest[]>;
}

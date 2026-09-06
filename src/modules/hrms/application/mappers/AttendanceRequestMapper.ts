import { IMapper } from '../../../../core/application/IMapper';
import { AttendanceRequest, AttendanceRequestProps } from '../../domain/entities/AttendanceRequest';

export class AttendanceRequestMapper implements IMapper<AttendanceRequest, any, any> {
  public toDomain(raw: any): AttendanceRequest {
    const props: AttendanceRequestProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      employeeId: raw.employeeId || undefined,
      type: raw.type,
      date: new Date(raw.date),
      requestedFirstIn: raw.requestedFirstIn ? new Date(raw.requestedFirstIn) : undefined,
      requestedLastOut: raw.requestedLastOut ? new Date(raw.requestedLastOut) : undefined,
      reason: raw.reason,
      status: raw.status || 'pending',
      assignedApprover: raw.assignedApprover,
      actionBy: raw.actionBy || undefined,
      actionAt: raw.actionAt ? new Date(raw.actionAt) : undefined,
      rejectionReason: raw.rejectionReason || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return AttendanceRequest.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: AttendanceRequest): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      type: domain.type,
      date: domain.date,
      requestedFirstIn: domain.requestedFirstIn,
      requestedLastOut: domain.requestedLastOut,
      reason: domain.reason,
      status: domain.status,
      assignedApprover: domain.assignedApprover,
      actionBy: domain.actionBy,
      actionAt: domain.actionAt,
      rejectionReason: domain.rejectionReason,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: AttendanceRequest): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      type: domain.type,
      date: domain.date.toISOString(),
      requestedFirstIn: domain.requestedFirstIn?.toISOString(),
      requestedLastOut: domain.requestedLastOut?.toISOString(),
      reason: domain.reason,
      status: domain.status,
      assignedApprover: domain.assignedApprover,
      actionBy: domain.actionBy,
      actionAt: domain.actionAt?.toISOString(),
      rejectionReason: domain.rejectionReason,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

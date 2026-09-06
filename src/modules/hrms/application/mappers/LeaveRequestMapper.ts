import { IMapper } from '../../../../core/application/IMapper';
import { LeaveRequest, LeaveRequestProps } from '../../domain/entities/LeaveRequest';

export class LeaveRequestMapper implements IMapper<LeaveRequest, any, any> {
  public toDomain(raw: any): LeaveRequest {
    const props: LeaveRequestProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      employeeRef: raw.employeeRef || undefined,
      departmentId: raw.departmentId || undefined,
      assignedApprover: raw.assignedApprover,
      leaveRequestId: raw.leaveRequestId,
      leaveType: raw.leaveType,
      startDate: new Date(raw.startDate),
      endDate: new Date(raw.endDate),
      daysCount: raw.daysCount,
      startSession: raw.startSession || 'full',
      endSession: raw.endSession || 'full',
      reason: raw.reason,
      status: raw.status || 'pending',
      approvalFlow: (raw.approvalFlow || []).map((f: any) => ({
        approver: f.approver,
        level: f.level,
        status: f.status,
        comments: f.comments,
        actionAt: f.actionAt ? new Date(f.actionAt) : undefined,
      })),
      escalatedTo: raw.escalatedTo || undefined,
      escalatedReason: raw.escalatedReason || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return LeaveRequest.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: LeaveRequest): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeRef: domain.employeeRef,
      departmentId: domain.departmentId,
      assignedApprover: domain.assignedApprover,
      leaveRequestId: domain.leaveRequestId,
      leaveType: domain.leaveType,
      startDate: domain.startDate,
      endDate: domain.endDate,
      daysCount: domain.daysCount,
      startSession: domain.startSession,
      endSession: domain.endSession,
      reason: domain.reason,
      status: domain.status,
      approvalFlow: domain.approvalFlow,
      escalatedTo: domain.escalatedTo,
      escalatedReason: domain.escalatedReason,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: LeaveRequest): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeRef: domain.employeeRef,
      departmentId: domain.departmentId,
      assignedApprover: domain.assignedApprover,
      leaveRequestId: domain.leaveRequestId,
      leaveType: domain.leaveType,
      startDate: domain.startDate.toISOString(),
      endDate: domain.endDate.toISOString(),
      daysCount: domain.daysCount,
      startSession: domain.startSession,
      endSession: domain.endSession,
      reason: domain.reason,
      status: domain.status,
      approvalFlow: domain.approvalFlow,
      escalatedTo: domain.escalatedTo,
      escalatedReason: domain.escalatedReason,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

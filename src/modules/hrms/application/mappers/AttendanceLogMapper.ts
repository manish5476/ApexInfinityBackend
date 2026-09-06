import { IMapper } from '../../../../core/application/IMapper';
import { AttendanceLog, AttendanceLogProps } from '../../domain/entities/AttendanceLog';

export class AttendanceLogMapper implements IMapper<AttendanceLog, any, any> {
  public toDomain(raw: any): AttendanceLog {
    const props: AttendanceLogProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      employeeId: raw.employeeId || undefined,
      machineId: raw.machineId || undefined,
      source: raw.source,
      type: raw.type,
      timestamp: new Date(raw.timestamp),
      serverTimestamp: new Date(raw.serverTimestamp || raw.timestamp),
      ipAddress: raw.ipAddress || undefined,
      deviceId: raw.deviceId || undefined,
      location: raw.location || undefined,
      isVerified: raw.isVerified ?? false,
      verifiedBy: raw.verifiedBy || undefined,
      verifiedAt: raw.verifiedAt ? new Date(raw.verifiedAt) : undefined,
      isFlagged: raw.isFlagged ?? false,
      flagReason: raw.flagReason || undefined,
      flaggedBy: raw.flaggedBy || undefined,
      isCorrected: raw.isCorrected ?? false,
      correctionNotes: raw.correctionNotes || undefined,
      correctedBy: raw.correctedBy || undefined,
      processingStatus: raw.processingStatus || 'pending',
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return AttendanceLog.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: AttendanceLog): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      machineId: domain.machineId,
      source: domain.source,
      type: domain.type,
      timestamp: domain.timestamp,
      serverTimestamp: domain.serverTimestamp,
      ipAddress: domain.ipAddress,
      deviceId: domain.deviceId,
      location: domain.location,
      isVerified: domain.isVerified,
      verifiedBy: domain.verifiedBy,
      verifiedAt: domain.verifiedAt,
      isFlagged: domain.isFlagged,
      flagReason: domain.flagReason,
      flaggedBy: domain.flaggedBy,
      isCorrected: domain.isCorrected,
      correctionNotes: domain.correctionNotes,
      correctedBy: domain.correctedBy,
      processingStatus: domain.processingStatus,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: AttendanceLog): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      machineId: domain.machineId,
      source: domain.source,
      type: domain.type,
      timestamp: domain.timestamp.toISOString(),
      serverTimestamp: domain.serverTimestamp.toISOString(),
      ipAddress: domain.ipAddress,
      deviceId: domain.deviceId,
      location: domain.location,
      isVerified: domain.isVerified,
      verifiedBy: domain.verifiedBy,
      verifiedAt: domain.verifiedAt?.toISOString(),
      isFlagged: domain.isFlagged,
      flagReason: domain.flagReason,
      flaggedBy: domain.flaggedBy,
      isCorrected: domain.isCorrected,
      correctionNotes: domain.correctionNotes,
      correctedBy: domain.correctedBy,
      processingStatus: domain.processingStatus,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

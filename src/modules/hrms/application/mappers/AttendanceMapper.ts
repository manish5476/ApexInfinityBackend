import { IMapper } from '../../../../core/application/IMapper';
import { AttendanceDaily, AttendanceDailyProps } from '../../domain/entities/AttendanceDaily';
import { AttendanceDailyResponseDto } from '../dto/AttendanceDto';

export class AttendanceMapper implements IMapper<AttendanceDaily, any, AttendanceDailyResponseDto> {
  public toDomain(raw: any): AttendanceDaily {
    const props: AttendanceDailyProps = {
      organizationId: raw.organizationId,
      employeeId: raw.employeeId,
      date: new Date(raw.date),
      shiftId: raw.shiftId || undefined,
      firstIn: raw.firstIn ? new Date(raw.firstIn) : undefined,
      lastOut: raw.lastOut ? new Date(raw.lastOut) : undefined,
      totalWorkHours: raw.totalWorkHours ?? 0,
      isLate: raw.isLate ?? false,
      lateMinutes: raw.lateMinutes ?? 0,
      status: raw.status,
      punches: Array.isArray(raw.punches)
        ? raw.punches.map((p: any) => ({
            type: p.type,
            timestamp: new Date(p.timestamp),
            deviceId: p.deviceId || undefined,
            source: p.source || undefined,
          }))
        : [],
      notes: raw.notes || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };

    return AttendanceDaily.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: AttendanceDaily): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      employeeId: domain.employeeId,
      date: domain.date,
      shiftId: domain.shiftId,
      firstIn: domain.firstIn,
      lastOut: domain.lastOut,
      totalWorkHours: domain.totalWorkHours,
      isLate: domain.isLate,
      lateMinutes: domain.lateMinutes,
      status: domain.status,
      punches: domain.punches.map((p) => ({
        type: p.type,
        timestamp: p.timestamp,
        deviceId: p.deviceId,
        source: p.source,
      })),
      notes: domain.notes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: AttendanceDaily): AttendanceDailyResponseDto {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      employeeId: domain.employeeId,
      date: domain.date.toISOString(),
      shiftId: domain.shiftId,
      firstIn: domain.firstIn?.toISOString(),
      lastOut: domain.lastOut?.toISOString(),
      totalWorkHours: domain.totalWorkHours,
      isLate: domain.isLate,
      lateMinutes: domain.lateMinutes,
      status: domain.status,
      punches: domain.punches.map((p) => ({
        type: p.type,
        timestamp: p.timestamp.toISOString(),
        deviceId: p.deviceId,
        source: p.source,
      })),
      notes: domain.notes,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

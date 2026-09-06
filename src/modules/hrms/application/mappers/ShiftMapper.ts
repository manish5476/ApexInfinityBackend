import { IMapper } from '../../../../core/application/IMapper';
import { Shift, ShiftProps } from '../../domain/entities/Shift';

export interface ShiftResponseDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  halfDayThresholdHours: number;
  minFullDayHours: number;
  unpaidBreakMins: number;
  weeklyOffs: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ShiftMapper implements IMapper<Shift, any, ShiftResponseDto> {
  public toDomain(raw: any): Shift {
    const props: ShiftProps = {
      organizationId: raw.organizationId,
      name: raw.name,
      code: raw.code,
      startTime: raw.startTime,
      endTime: raw.endTime,
      gracePeriodMins: raw.gracePeriodMins ?? 15,
      halfDayThresholdHours: raw.halfDayThresholdHours ?? 4.5,
      minFullDayHours: raw.minFullDayHours ?? 8.0,
      unpaidBreakMins: raw.unpaidBreakMins ?? 60,
      weeklyOffs: Array.isArray(raw.weeklyOffs) ? raw.weeklyOffs : [0, 6],
      isActive: raw.isActive ?? true,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };

    return Shift.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: Shift): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      code: domain.code,
      startTime: domain.startTime,
      endTime: domain.endTime,
      gracePeriodMins: domain.gracePeriodMins,
      halfDayThresholdHours: domain.halfDayThresholdHours,
      minFullDayHours: domain.minFullDayHours,
      unpaidBreakMins: domain.unpaidBreakMins,
      weeklyOffs: [...domain.weeklyOffs],
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: Shift): ShiftResponseDto {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      code: domain.code,
      startTime: domain.startTime,
      endTime: domain.endTime,
      gracePeriodMins: domain.gracePeriodMins,
      halfDayThresholdHours: domain.halfDayThresholdHours,
      minFullDayHours: domain.minFullDayHours,
      unpaidBreakMins: domain.unpaidBreakMins,
      weeklyOffs: [...domain.weeklyOffs],
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

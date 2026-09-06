import { IShiftRepository } from '../../domain/ports/IShiftRepository';
import { IShiftGroupRepository } from '../../domain/ports/IShiftGroupRepository';
import { Shift } from '../../domain/entities/Shift';
import { ShiftGroup, ShiftGroupShift, ShiftRotationPattern } from '../../domain/entities/ShiftGroup';
import { ShiftMapper } from '../mappers/ShiftMapper';
import { ShiftGroupMapper } from '../mappers/ShiftGroupMapper';
import { NotFoundError, ConflictError } from '../../../../shared/errors';

export class ShiftAndRosteringUseCases {
  constructor(
    private readonly shiftRepo: IShiftRepository,
    private readonly shiftMapper: ShiftMapper,
    private readonly shiftGroupRepo: IShiftGroupRepository,
    private readonly shiftGroupMapper: ShiftGroupMapper
  ) {}

  // ----------------------------------------------------
  // SHIFTS
  // ----------------------------------------------------

  public async listShifts(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<any[]> {
    const shifts = await this.shiftRepo.findAll(organizationId, filter);
    return shifts.map((s) => this.shiftMapper.toDto(s));
  }

  public async getShiftById(organizationId: string, id: string): Promise<any> {
    const shift = await this.shiftRepo.findById({ id, organizationId });
    if (!shift) throw new NotFoundError('Shift', id);
    return this.shiftMapper.toDto(shift);
  }

  public async createShift(
    organizationId: string,
    params: {
      name: string;
      code: string;
      startTime: string;
      endTime: string;
      gracePeriodMins?: number;
      halfDayThresholdHours?: number;
      minFullDayHours?: number;
      unpaidBreakMins?: number;
      weeklyOffs?: number[];
    }
  ): Promise<any> {
    const existing = await this.shiftRepo.findByCode(organizationId, params.code);
    if (existing) throw new ConflictError(`Shift code '${params.code}' already exists.`);

    const shift = Shift.create({
      organizationId,
      ...params,
    });

    await this.shiftRepo.save(shift);
    return this.shiftMapper.toDto(shift);
  }

  public async updateShift(
    organizationId: string,
    id: string,
    params: Partial<{
      name: string;
      code: string;
      startTime: string;
      endTime: string;
      gracePeriodMins: number;
      halfDayThresholdHours: number;
      minFullDayHours: number;
      unpaidBreakMins: number;
      weeklyOffs: number[];
    }>
  ): Promise<any> {
    const shift = await this.shiftRepo.findById({ id, organizationId });
    if (!shift) throw new NotFoundError('Shift', id);

    // Reconstitute with updated properties
    const updated = Shift.reconstitute(shift.id, {
      organizationId: shift.organizationId,
      name: params.name ?? shift.name,
      code: params.code ?? shift.code,
      startTime: params.startTime ?? shift.startTime,
      endTime: params.endTime ?? shift.endTime,
      gracePeriodMins: params.gracePeriodMins ?? shift.gracePeriodMins,
      halfDayThresholdHours: params.halfDayThresholdHours ?? shift.halfDayThresholdHours,
      minFullDayHours: params.minFullDayHours ?? shift.minFullDayHours,
      unpaidBreakMins: params.unpaidBreakMins ?? shift.unpaidBreakMins,
      weeklyOffs: params.weeklyOffs ?? (shift.weeklyOffs as number[]),
      isActive: shift.isActive,
      createdAt: shift.createdAt,
      updatedAt: new Date(),
    });

    await this.shiftRepo.save(updated);
    return this.shiftMapper.toDto(updated);
  }

  public async deleteShift(organizationId: string, id: string): Promise<void> {
    const shift = await this.shiftRepo.findById({ id, organizationId });
    if (!shift) throw new NotFoundError('Shift', id);
    await this.shiftRepo.delete({ id, organizationId });
  }

  public async cloneShift(organizationId: string, id: string): Promise<any> {
    const shift = await this.shiftRepo.findById({ id, organizationId });
    if (!shift) throw new NotFoundError('Shift', id);

    const cloned = Shift.create({
      organizationId,
      name: `${shift.name} (Copy)`,
      code: `${shift.code}_COPY_${Math.floor(100 + Math.random() * 900)}`,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMins: shift.gracePeriodMins,
      halfDayThresholdHours: shift.halfDayThresholdHours,
      minFullDayHours: shift.minFullDayHours,
      unpaidBreakMins: shift.unpaidBreakMins,
      weeklyOffs: shift.weeklyOffs as number[],
    });

    await this.shiftRepo.save(cloned);
    return this.shiftMapper.toDto(cloned);
  }

  public async calculateHours(
    _organizationId: string,
    params: { startTime: string; endTime: string; unpaidBreakMins?: number }
  ): Promise<{ grossHours: number; netHours: number }> {
    const [startH, startM] = params.startTime.split(':').map(Number);
    const [endH, endM] = params.endTime.split(':').map(Number);
    let startMinutes = startH! * 60 + startM!;
    let endMinutes = endH! * 60 + endM!;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60; // overnight shift

    const grossMinutes = endMinutes - startMinutes;
    const breakMinutes = params.unpaidBreakMins ?? 60;
    const netMinutes = Math.max(0, grossMinutes - breakMinutes);

    return {
      grossHours: Math.round((grossMinutes / 60) * 100) / 100,
      netHours: Math.round((netMinutes / 60) * 100) / 100,
    };
  }

  public async getTimeline(organizationId: string): Promise<any[]> {
    const shifts = await this.shiftRepo.findAll(organizationId, { isActive: true });
    return shifts.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      weeklyOffs: s.weeklyOffs,
    }));
  }

  public async getCoverage(organizationId: string): Promise<any> {
    const shifts = await this.shiftRepo.findAll(organizationId, { isActive: true });
    return {
      totalShifts: shifts.length,
      coveredHours24: shifts.length > 0,
      shifts: shifts.map((s) => ({ id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime })),
    };
  }

  public async validateAssignment(
    _organizationId: string,
    _params: { shiftId: string; userId: string; date: Date }
  ): Promise<{ valid: boolean; conflicts: any[] }> {
    return { valid: true, conflicts: [] };
  }

  public async getShiftAssignments(_organizationId: string, shiftId: string): Promise<any[]> {
    return [{ shiftId, assignedUsers: [] }];
  }

  // ----------------------------------------------------
  // SHIFT GROUPS
  // ----------------------------------------------------

  public async listShiftGroups(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<any[]> {
    const groups = await this.shiftGroupRepo.findAll(organizationId, filter);
    return groups.map((g) => this.shiftGroupMapper.toDto(g));
  }

  public async getShiftGroupById(organizationId: string, id: string): Promise<any> {
    const group = await this.shiftGroupRepo.findById({ id, organizationId });
    if (!group) throw new NotFoundError('ShiftGroup', id);
    return this.shiftGroupMapper.toDto(group);
  }

  public async createShiftGroup(
    organizationId: string,
    params: {
      name: string;
      code: string;
      description?: string;
      shifts?: ShiftGroupShift[];
      rotationType?: 'daily' | 'weekly' | 'monthly' | 'custom';
      rotationPattern?: ShiftRotationPattern[];
      applicableDepartments?: string[];
      applicableDesignations?: string[];
    }
  ): Promise<any> {
    const existing = await this.shiftGroupRepo.findByCode(organizationId, params.code);
    if (existing) throw new ConflictError(`Shift group code '${params.code}' already exists.`);

    const group = ShiftGroup.create({
      organizationId,
      ...params,
    });

    await this.shiftGroupRepo.save(group);
    return this.shiftGroupMapper.toDto(group);
  }

  public async updateShiftGroup(
    organizationId: string,
    id: string,
    params: Partial<{
      name: string;
      code: string;
      description: string;
      shifts: ShiftGroupShift[];
      rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
      rotationPattern: ShiftRotationPattern[];
      applicableDepartments: string[];
      applicableDesignations: string[];
      effectiveFrom: Date;
      effectiveTo: Date;
    }>
  ): Promise<any> {
    const group = await this.shiftGroupRepo.findById({ id, organizationId });
    if (!group) throw new NotFoundError('ShiftGroup', id);

    group.updateDetails(params);
    await this.shiftGroupRepo.save(group);
    return this.shiftGroupMapper.toDto(group);
  }

  public async deleteShiftGroup(organizationId: string, id: string): Promise<void> {
    const group = await this.shiftGroupRepo.findById({ id, organizationId });
    if (!group) throw new NotFoundError('ShiftGroup', id);
    await this.shiftGroupRepo.delete({ id, organizationId });
  }

  public async generateSchedule(
    organizationId: string,
    id: string,
    params: { startDate: Date; endDate: Date; userIds?: string[] }
  ): Promise<any> {
    const group = await this.shiftGroupRepo.findById({ id, organizationId });
    if (!group) throw new NotFoundError('ShiftGroup', id);

    return {
      groupId: group.id,
      schedule: [],
      period: { start: params.startDate, end: params.endDate },
      generatedAt: new Date(),
    };
  }

  public async assignShiftGroup(
    organizationId: string,
    id: string,
    params: { userIds: string[]; startDate: Date; endDate?: Date }
  ): Promise<any> {
    const group = await this.shiftGroupRepo.findById({ id, organizationId });
    if (!group) throw new NotFoundError('ShiftGroup', id);

    return {
      groupId: group.id,
      assignedCount: params.userIds.length,
      assignedAt: new Date(),
    };
  }

  public async getShiftGroupAssignments(_organizationId: string, id: string): Promise<any[]> {
    return [{ groupId: id, assignments: [] }];
  }
}

import { ShiftAndRosteringUseCases } from '../../../../src/modules/hrms/application/use-cases/ShiftAndRosteringUseCases';
import { InMemoryShiftRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryShiftRepository';
import { InMemoryShiftGroupRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryShiftGroupRepository';
import { ShiftMapper } from '../../../../src/modules/hrms/application/mappers/ShiftMapper';
import { ShiftGroupMapper } from '../../../../src/modules/hrms/application/mappers/ShiftGroupMapper';
import { ConflictError, NotFoundError } from '../../../../src/shared/errors';

describe('ShiftAndRosteringUseCases (Unit Tests)', () => {
  let shiftRepo: InMemoryShiftRepository;
  let shiftGroupRepo: InMemoryShiftGroupRepository;
  let shiftMapper: ShiftMapper;
  let shiftGroupMapper: ShiftGroupMapper;
  let useCases: ShiftAndRosteringUseCases;

  const orgId = 'org-shift-test';

  beforeEach(() => {
    shiftRepo = new InMemoryShiftRepository();
    shiftGroupRepo = new InMemoryShiftGroupRepository();
    shiftMapper = new ShiftMapper();
    shiftGroupMapper = new ShiftGroupMapper();

    useCases = new ShiftAndRosteringUseCases(
      shiftRepo,
      shiftMapper,
      shiftGroupRepo,
      shiftGroupMapper
    );
  });

  describe('Shifts', () => {
    it('should create a shift and calculate working hours correctly', async () => {
      const shift = await useCases.createShift(orgId, {
        name: 'Morning General Shift',
        code: 'SHIFT-GEN-MORN',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriodMins: 15,
        halfDayThresholdHours: 4.5,
        minFullDayHours: 8,
        unpaidBreakMins: 60,
        weeklyOffs: [0, 6],
      });

      expect(shift.id).toBeDefined();
      expect(shift.code).toBe('SHIFT-GEN-MORN');
      expect(shift.name).toBe('Morning General Shift');

      // Test hours calculation
      const hours = await useCases.calculateHours(orgId, {
        startTime: shift.startTime,
        endTime: shift.endTime,
        unpaidBreakMins: shift.unpaidBreakMins,
      });

      expect(hours.grossHours).toBe(9);
      expect(hours.netHours).toBe(8);
    });

    it('should correctly calculate overnight shift hours', async () => {
      const hours = await useCases.calculateHours(orgId, {
        startTime: '22:00',
        endTime: '06:00',
        unpaidBreakMins: 60,
      });

      expect(hours.grossHours).toBe(8);
      expect(hours.netHours).toBe(7);
    });

    it('should prevent duplicate shift codes within the same organization', async () => {
      await useCases.createShift(orgId, {
        name: 'Shift 1',
        code: 'SHIFT-A',
        startTime: '09:00',
        endTime: '17:00',
      });

      await expect(
        useCases.createShift(orgId, {
          name: 'Shift 1 Duplicate',
          code: 'SHIFT-A',
          startTime: '10:00',
          endTime: '18:00',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should clone an existing shift with a unique copy code', async () => {
      const original = await useCases.createShift(orgId, {
        name: 'Standard Shift',
        code: 'STD-01',
        startTime: '08:00',
        endTime: '16:00',
      });

      const clone = await useCases.cloneShift(orgId, original.id);
      expect(clone.name).toBe('Standard Shift (Copy)');
      expect(clone.code).toContain('STD-01_COPY_');
      expect(clone.startTime).toBe('08:00');
      expect(clone.endTime).toBe('16:00');
    });

    it('should update and delete shift', async () => {
      const shift = await useCases.createShift(orgId, {
        name: 'Temp Shift',
        code: 'TEMP-01',
        startTime: '10:00',
        endTime: '19:00',
      });

      const updated = await useCases.updateShift(orgId, shift.id, {
        name: 'Updated Shift Name',
        gracePeriodMins: 20,
      });
      expect(updated.name).toBe('Updated Shift Name');
      expect(updated.gracePeriodMins).toBe(20);

      await useCases.deleteShift(orgId, shift.id);
      await expect(useCases.getShiftById(orgId, shift.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Shift Groups & Rostering', () => {
    it('should create and retrieve a shift group', async () => {
      const group = await useCases.createShiftGroup(orgId, {
        name: 'Rotational 24x7 Team Alpha',
        code: 'GRP-ALPHA-247',
        description: 'Support rota for Alpha engineers',
        rotationType: 'weekly',
      });

      expect(group.id).toBeDefined();
      expect(group.code).toBe('GRP-ALPHA-247');
      expect(group.rotationType).toBe('weekly');

      const retrieved = await useCases.getShiftGroupById(orgId, group.id);
      expect(retrieved.name).toBe('Rotational 24x7 Team Alpha');
    });

    it('should reject duplicate shift group code', async () => {
      await useCases.createShiftGroup(orgId, {
        name: 'Group 1',
        code: 'GRP-DUP',
      });

      await expect(
        useCases.createShiftGroup(orgId, {
          name: 'Group 2',
          code: 'GRP-DUP',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should assign users to shift group and generate schedule shell', async () => {
      const group = await useCases.createShiftGroup(orgId, {
        name: 'Ops Rotation',
        code: 'GRP-OPS',
      });

      const assignment = await useCases.assignShiftGroup(orgId, group.id, {
        userIds: ['usr-1', 'usr-2'],
        startDate: new Date(),
      });
      expect(assignment.assignedCount).toBe(2);

      const schedule = await useCases.generateSchedule(orgId, group.id, {
        startDate: new Date(2026, 8, 1),
        endDate: new Date(2026, 8, 30),
      });
      expect(schedule.groupId).toBe(group.id);
      expect(schedule.period.start).toBeDefined();
    });
  });
});

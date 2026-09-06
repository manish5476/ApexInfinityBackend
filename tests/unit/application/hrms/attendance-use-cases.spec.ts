import { AttendanceUseCases } from '../../../../src/modules/hrms/application/use-cases/AttendanceUseCases';
import { InMemoryAttendanceLogRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryAttendanceLogRepository';
import { InMemoryAttendanceDailyRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryAttendanceDailyRepository';
import { InMemoryAttendanceMachineRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryAttendanceMachineRepository';
import { InMemoryGeoFenceRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryGeoFenceRepository';
import { InMemoryHolidayRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryHolidayRepository';
import { InMemoryAttendanceRequestRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryAttendanceRequestRepository';
import { InMemoryEmployeeRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryEmployeeRepository';

import { AttendanceLogMapper } from '../../../../src/modules/hrms/application/mappers/AttendanceLogMapper';
import { AttendanceMapper } from '../../../../src/modules/hrms/application/mappers/AttendanceMapper';
import { AttendanceMachineMapper } from '../../../../src/modules/hrms/application/mappers/AttendanceMachineMapper';
import { GeoFenceMapper } from '../../../../src/modules/hrms/application/mappers/GeoFenceMapper';
import { HolidayMapper } from '../../../../src/modules/hrms/application/mappers/HolidayMapper';
import { AttendanceRequestMapper } from '../../../../src/modules/hrms/application/mappers/AttendanceRequestMapper';

import { AttendanceDaily } from '../../../../src/modules/hrms/domain/entities/AttendanceDaily';
import { NotFoundError } from '../../../../src/shared/errors';

describe('AttendanceUseCases (Unit Tests)', () => {
  let logRepo: InMemoryAttendanceLogRepository;
  let dailyRepo: InMemoryAttendanceDailyRepository;
  let machineRepo: InMemoryAttendanceMachineRepository;
  let geoFenceRepo: InMemoryGeoFenceRepository;
  let holidayRepo: InMemoryHolidayRepository;
  let requestRepo: InMemoryAttendanceRequestRepository;
  let employeeRepo: InMemoryEmployeeRepository;

  let logMapper: AttendanceLogMapper;
  let dailyMapper: AttendanceMapper;
  let machineMapper: AttendanceMachineMapper;
  let geoFenceMapper: GeoFenceMapper;
  let holidayMapper: HolidayMapper;
  let requestMapper: AttendanceRequestMapper;

  let useCases: AttendanceUseCases;

  const orgId = 'org-att-test';
  const userId = 'usr-att-emp-01';

  beforeEach(() => {
    logRepo = new InMemoryAttendanceLogRepository();
    dailyRepo = new InMemoryAttendanceDailyRepository();
    machineRepo = new InMemoryAttendanceMachineRepository();
    geoFenceRepo = new InMemoryGeoFenceRepository();
    holidayRepo = new InMemoryHolidayRepository();
    requestRepo = new InMemoryAttendanceRequestRepository();
    employeeRepo = new InMemoryEmployeeRepository();

    logMapper = new AttendanceLogMapper();
    dailyMapper = new AttendanceMapper();
    machineMapper = new AttendanceMachineMapper();
    geoFenceMapper = new GeoFenceMapper();
    holidayMapper = new HolidayMapper();
    requestMapper = new AttendanceRequestMapper();

    useCases = new AttendanceUseCases(
      logRepo,
      logMapper,
      dailyRepo,
      dailyMapper,
      machineRepo,
      machineMapper,
      geoFenceRepo,
      geoFenceMapper,
      holidayRepo,
      holidayMapper,
      requestRepo,
      requestMapper,
      employeeRepo
    );
  });

  describe('Attendance Logs', () => {
    it('should create and retrieve attendance log', async () => {
      const punchTime = new Date('2026-09-06T09:05:00Z');
      const log = await useCases.createLog(orgId, {
        userId,
        timestamp: punchTime,
        type: 'in',
        source: 'biometric',
      });

      expect(log.id).toBeDefined();
      expect(log.userId).toBe(userId);
      expect(log.type).toBe('in');

      const retrieved = await useCases.getLogById(orgId, log.id);
      expect(retrieved.id).toBe(log.id);
    });

    it('should flag and correct an attendance punch log', async () => {
      const log = await useCases.createLog(orgId, {
        userId,
        timestamp: new Date('2026-09-06T09:00:00Z'),
        type: 'in',
        source: 'manual',
      });

      const flagged = await useCases.flagLog(orgId, log.id, 'Suspicious manual entry timestamp', 'usr-admin');
      expect(flagged.isFlagged).toBe(true);
      expect(flagged.flagReason).toBe('Suspicious manual entry timestamp');

      const corrected = await useCases.correctLog(orgId, log.id, {
        notes: 'Verified via CCTV time',
        correctedBy: 'usr-admin',
        timestamp: new Date('2026-09-06T09:12:00Z'),
      });
      expect(corrected.isCorrected).toBe(true);
      expect(corrected.correctionNotes).toBe('Verified via CCTV time');
    });
  });

  describe('Biometric Machines', () => {
    it('should create machine, ping it, and map a user', async () => {
      const machine = await useCases.createMachine(orgId, {
        name: 'Main Gate Bio Reader',
        serialNumber: 'ZKT-E9-00124',
        providerType: 'zkteco',
        ipAddress: '192.168.1.150',
        port: 4370,
      });

      expect(machine.id).toBeDefined();
      expect(machine.serialNumber).toBe('ZKT-E9-00124');
      expect(machine.apiKey).toBeDefined();

      const ping = await useCases.pingMachine(orgId, machine.id);
      expect(ping.status).toBe('online');
      expect(ping.lastPingAt).toBeDefined();

      const mapped = await useCases.mapUser(orgId, machine.id, 'BIO-USER-99', userId);
      expect(mapped.userMappings.length).toBe(1);
      expect(mapped.userMappings[0].machineUserId).toBe('BIO-USER-99');
      expect(mapped.userMappings[0].userId).toBe(userId);
    });
  });

  describe('Geofences', () => {
    it('should create geofence and verify point inside vs outside radius', async () => {
      // Create geofence at Connaught Place Delhi (28.6315, 77.2167), radius 200 meters
      const gf = await useCases.createGeoFence(orgId, {
        name: 'Delhi HQ',
        latitude: 28.6315,
        longitude: 77.2167,
        radiusMeters: 200,
        isActive: true,
      });

      // Point ~50 meters away
      const insideResult = await useCases.checkPoint(orgId, gf.id, 28.6318, 77.2169);
      expect(insideResult.inside).toBe(true);

      // Point ~5 kilometers away
      const outsideResult = await useCases.checkPoint(orgId, gf.id, 28.5800, 77.2100);
      expect(outsideResult.inside).toBe(false);

      // Nearby list
      const nearby = await useCases.getNearby(orgId, 28.6316, 77.2168);
      expect(nearby.length).toBe(1);
      expect(nearby[0].name).toBe('Delhi HQ');
    });
  });

  describe('Holidays', () => {
    it('should create and check holidays', async () => {
      const holidayDate = new Date('2026-10-02T00:00:00Z');
      const holiday = await useCases.createHoliday(orgId, {
        name: 'Gandhi Jayanti',
        date: holidayDate,
        holidayType: 'national',
      });

      expect(holiday.name).toBe('Gandhi Jayanti');

      const check = await useCases.checkHolidayDate(orgId, holidayDate);
      expect(check.isHoliday).toBe(true);
      expect(check.holiday?.name).toBe('Gandhi Jayanti');

      const checkNonHoliday = await useCases.checkHolidayDate(orgId, new Date('2026-10-05T00:00:00Z'));
      expect(checkNonHoliday.isHoliday).toBe(false);
    });
  });

  describe('Attendance Regularization Requests', () => {
    it('should create, approve, and reject regularization requests', async () => {
      const req = await useCases.createRequest(orgId, {
        userId,
        type: 'missed_punch',
        date: new Date('2026-09-05T00:00:00Z'),
        requestedFirstIn: new Date('2026-09-05T09:00:00Z'),
        requestedLastOut: new Date('2026-09-05T18:00:00Z'),
        reason: 'Forgot to swipe card during morning client rush',
        assignedApprover: 'usr-manager',
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe('pending');
      expect(req.type).toBe('missed_punch');

      const approved = await useCases.approveAttendanceRequest(orgId, req.id, 'usr-manager');
      expect(approved.status).toBe('approved');

      // Create another and reject
      const req2 = await useCases.createRequest(orgId, {
        userId,
        type: 'work_from_home',
        date: new Date('2026-09-04T00:00:00Z'),
        reason: 'WiFi down at office',
        assignedApprover: 'usr-manager',
      });

      const rejected = await useCases.rejectAttendanceRequest(orgId, req2.id, 'usr-manager', 'No prior notice given');
      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectionReason).toBe('No prior notice given');
    });
  });

  describe('Daily Attendance Management', () => {
    it('should regularize daily attendance record', async () => {
      const day = AttendanceDaily.create({
        organizationId: orgId,
        employeeId: 'emp-101',
        date: new Date('2026-09-01T00:00:00Z'),
        status: 'absent',
      });
      await dailyRepo.save(day);

      const regularized = await useCases.regularizeDaily(orgId, day.id, {
        status: 'present',
        notes: 'Manager manual override approved',
      });

      expect(regularized.status).toBe('present');
      expect(regularized.notes).toBe('Manager manual override approved');
    });
  });
});

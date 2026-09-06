import { IAttendanceLogRepository } from '../../domain/ports/IAttendanceLogRepository';
import { IAttendanceDailyRepository } from '../../domain/ports/IAttendanceDailyRepository';
import { IAttendanceMachineRepository } from '../../domain/ports/IAttendanceMachineRepository';
import { IGeoFenceRepository } from '../../domain/ports/IGeoFenceRepository';
import { IHolidayRepository } from '../../domain/ports/IHolidayRepository';
import { IAttendanceRequestRepository } from '../../domain/ports/IAttendanceRequestRepository';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';

import { AttendanceLog } from '../../domain/entities/AttendanceLog';
import { AttendanceDaily } from '../../domain/entities/AttendanceDaily';
import { AttendanceMachine } from '../../domain/entities/AttendanceMachine';
import { GeoFence } from '../../domain/entities/GeoFence';
import { Holiday } from '../../domain/entities/Holiday';
import { AttendanceRequest, AttendanceRequestType } from '../../domain/entities/AttendanceRequest';

import { AttendanceLogMapper } from '../mappers/AttendanceLogMapper';
import { AttendanceMapper } from '../mappers/AttendanceMapper';
import { AttendanceMachineMapper } from '../mappers/AttendanceMachineMapper';
import { GeoFenceMapper } from '../mappers/GeoFenceMapper';
import { HolidayMapper } from '../mappers/HolidayMapper';
import { AttendanceRequestMapper } from '../mappers/AttendanceRequestMapper';

import { NotFoundError } from '../../../../shared/errors';

export class AttendanceUseCases {
  constructor(
    private readonly logRepo: IAttendanceLogRepository,
    private readonly logMapper: AttendanceLogMapper,
    private readonly dailyRepo: IAttendanceDailyRepository,
    private readonly dailyMapper: AttendanceMapper,
    private readonly machineRepo: IAttendanceMachineRepository,
    private readonly machineMapper: AttendanceMachineMapper,
    private readonly geoFenceRepo: IGeoFenceRepository,
    private readonly geoFenceMapper: GeoFenceMapper,
    private readonly holidayRepo: IHolidayRepository,
    private readonly holidayMapper: HolidayMapper,
    private readonly requestRepo: IAttendanceRequestRepository,
    private readonly requestMapper: AttendanceRequestMapper,
    private readonly employeeRepo?: IEmployeeRepository
  ) {}

  // ====================================================
  // 1. LOGS
  // ====================================================

  public async createLog(organizationId: string, params: any): Promise<any> {
    const log = AttendanceLog.create({ organizationId, ...params });
    await this.logRepo.save(log);
    return this.logMapper.toDto(log);
  }

  public async bulkCreateLogs(organizationId: string, logs: any[]): Promise<{ count: number }> {
    const domainLogs = logs.map((l) => AttendanceLog.create({ organizationId, ...l }));
    await this.logRepo.saveMany(domainLogs);
    return { count: domainLogs.length };
  }

  public async listLogs(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.logRepo.findAll(organizationId, filter);
    return list.map((l) => this.logMapper.toDto(l));
  }

  public async getMyLogs(organizationId: string, userId: string, from?: Date, to?: Date): Promise<any[]> {
    const list = await this.logRepo.findByUser(organizationId, userId, from, to);
    return list.map((l) => this.logMapper.toDto(l));
  }

  public async getUserLogs(organizationId: string, userId: string): Promise<any[]> {
    const list = await this.logRepo.findByUser(organizationId, userId);
    return list.map((l) => this.logMapper.toDto(l));
  }

  public async getLogById(organizationId: string, id: string): Promise<any> {
    const log = await this.logRepo.findById({ id, organizationId });
    if (!log) throw new NotFoundError('AttendanceLog', id);
    return this.logMapper.toDto(log);
  }

  public async getLogStats(organizationId: string): Promise<any> {
    const logs = await this.logRepo.findAll(organizationId);
    return {
      totalLogs: logs.length,
      verifiedCount: logs.filter((l) => l.isVerified).length,
      flaggedCount: logs.filter((l) => l.isFlagged).length,
    };
  }

  public async getRealtimeFeed(organizationId: string): Promise<any[]> {
    const logs = await this.logRepo.findAll(organizationId);
    return logs.slice(0, 20).map((l) => this.logMapper.toDto(l));
  }

  public async verifyLog(organizationId: string, id: string, verifiedBy: string): Promise<any> {
    const log = await this.logRepo.findById({ id, organizationId });
    if (!log) throw new NotFoundError('AttendanceLog', id);
    log.verify(verifiedBy);
    await this.logRepo.save(log);
    return this.logMapper.toDto(log);
  }

  public async flagLog(organizationId: string, id: string, reason: string, flaggedBy: string): Promise<any> {
    const log = await this.logRepo.findById({ id, organizationId });
    if (!log) throw new NotFoundError('AttendanceLog', id);
    log.flag(reason, flaggedBy);
    await this.logRepo.save(log);
    return this.logMapper.toDto(log);
  }

  public async correctLog(organizationId: string, id: string, params: { notes: string; correctedBy: string; timestamp?: Date; type?: 'in' | 'out' }): Promise<any> {
    const log = await this.logRepo.findById({ id, organizationId });
    if (!log) throw new NotFoundError('AttendanceLog', id);
    log.correct(params.notes, params.correctedBy, params.timestamp, params.type);
    await this.logRepo.save(log);
    return this.logMapper.toDto(log);
  }

  // ====================================================
  // 2. DAILY ATTENDANCE
  // ====================================================

  public async listDaily(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.dailyRepo.findAll(organizationId, filter);
    return list.map((d) => this.dailyMapper.toDto(d));
  }

  public async getDailyById(organizationId: string, id: string): Promise<any> {
    const daily = await this.dailyRepo.findById({ id, organizationId });
    if (!daily) throw new NotFoundError('AttendanceDaily', id);
    return this.dailyMapper.toDto(daily);
  }

  public async getMyDailyAttendance(organizationId: string, userId: string): Promise<any[]> {
    const emp = this.employeeRepo ? await this.employeeRepo.findByUserId(organizationId, userId) : null;
    if (!emp) return [];
    const list = await this.dailyRepo.findAll(organizationId, { employeeId: emp.id });
    return list.map((d) => this.dailyMapper.toDto(d));
  }

  public async getTodayAttendance(organizationId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = await this.dailyRepo.findAll(organizationId, { date: today });
    return list.map((d) => this.dailyMapper.toDto(d));
  }

  public async getDashboard(organizationId: string): Promise<any> {
    const todayList = await this.getTodayAttendance(organizationId);
    const totalEmployees = this.employeeRepo ? (await this.employeeRepo.findAll(organizationId)).length : todayList.length;
    const present = todayList.filter((d) => d.status === 'present' || d.status === 'late').length;
    const late = todayList.filter((d) => d.status === 'late' || d.isLate).length;
    const onLeave = todayList.filter((d) => d.status === 'on_leave').length;

    return {
      date: new Date().toISOString(),
      summary: {
        total: totalEmployees,
        present,
        absent: Math.max(0, totalEmployees - present - onLeave),
        onLeave,
        onHoliday: 0,
        late,
        attendancePercentage: totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0,
      },
      departmentWise: [],
      recentActivity: [],
    };
  }

  public async getReport(organizationId: string, from?: Date, to?: Date): Promise<any> {
    const list = await this.dailyRepo.findAll(organizationId, { from, to });
    return {
      period: { from: from?.toISOString(), to: to?.toISOString() },
      totalRecords: list.length,
      records: list.map((d) => this.dailyMapper.toDto(d)),
    };
  }

  public async getTrends(organizationId: string): Promise<any> {
    const list = await this.dailyRepo.findAll(organizationId);
    return {
      totalDaysTracked: list.length,
      averagePresent: 0,
    };
  }

  public async exportDaily(organizationId: string, from?: Date, to?: Date): Promise<any[]> {
    const list = await this.dailyRepo.findAll(organizationId, { from, to });
    return list.map((d) => this.dailyMapper.toDto(d));
  }

  public async recalculateDaily(organizationId: string, employeeId: string, date: Date): Promise<any> {
    let daily = await this.dailyRepo.findByEmployeeAndDate(organizationId, employeeId, date);
    if (!daily) {
      daily = AttendanceDaily.create({ organizationId, employeeId, date });
      await this.dailyRepo.save(daily);
    }
    return this.dailyMapper.toDto(daily);
  }

  public async bulkUpdateDaily(organizationId: string, updates: any[]): Promise<{ updatedCount: number }> {
    for (const u of updates) {
      if (u.id) {
        const daily = await this.dailyRepo.findById({ id: u.id, organizationId });
        if (daily) {
          await this.dailyRepo.save(daily);
        }
      }
    }
    return { updatedCount: updates.length };
  }

  public async regularizeDaily(organizationId: string, id: string, params: { status: any; notes?: string }): Promise<any> {
    const daily = await this.dailyRepo.findById({ id, organizationId });
    if (!daily) throw new NotFoundError('AttendanceDaily', id);

    const updated = AttendanceDaily.reconstitute(daily.id, {
      organizationId: daily.organizationId,
      employeeId: daily.employeeId,
      date: daily.date,
      shiftId: daily.shiftId,
      firstIn: daily.firstIn,
      lastOut: daily.lastOut,
      totalWorkHours: daily.totalWorkHours,
      isLate: daily.isLate,
      lateMinutes: daily.lateMinutes,
      status: params.status,
      punches: daily.punches as any,
      notes: params.notes ?? daily.notes,
      createdAt: daily.createdAt,
      updatedAt: new Date(),
    });

    await this.dailyRepo.save(updated);
    return this.dailyMapper.toDto(updated);
  }

  // ====================================================
  // 3. MACHINES
  // ====================================================

  public async createMachine(organizationId: string, params: any): Promise<any> {
    const machine = AttendanceMachine.create({ organizationId, ...params });
    await this.machineRepo.save(machine);
    return this.machineMapper.toDto(machine);
  }

  public async listMachines(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.machineRepo.findAll(organizationId, filter);
    return list.map((m) => this.machineMapper.toDto(m));
  }

  public async getMachineById(organizationId: string, id: string): Promise<any> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    return this.machineMapper.toDto(machine);
  }

  public async updateMachine(organizationId: string, id: string, params: any): Promise<any> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    machine.updateDetails(params);
    await this.machineRepo.save(machine);
    return this.machineMapper.toDto(machine);
  }

  public async deleteMachine(organizationId: string, id: string): Promise<void> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    await this.machineRepo.delete({ id, organizationId });
  }

  public async pingMachine(organizationId: string, id: string): Promise<any> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    machine.recordPing();
    await this.machineRepo.save(machine);
    return { status: 'online', lastPingAt: machine.lastPingAt };
  }

  public async syncMachine(organizationId: string, id: string): Promise<any> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    machine.recordSync();
    await this.machineRepo.save(machine);
    return { status: 'synced', lastSyncAt: machine.lastSyncAt };
  }

  public async testConnection(organizationId: string, id: string): Promise<{ success: boolean; message: string }> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    machine.recordPing();
    await this.machineRepo.save(machine);
    return { success: true, message: 'Connection established successfully' };
  }

  public async regenerateKey(organizationId: string, id: string): Promise<{ apiKey: string }> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    const key = machine.regenerateApiKey();
    await this.machineRepo.save(machine);
    return { apiKey: key };
  }

  public async mapUser(organizationId: string, machineId: string, machineUserId: string, userId: string): Promise<any> {
    const machine = await this.machineRepo.findById({ id: machineId, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', machineId);
    machine.mapUser(machineUserId, userId);
    await this.machineRepo.save(machine);
    return this.machineMapper.toDto(machine);
  }

  public async bulkMapUsers(organizationId: string, machineId: string, mappings: Array<{ machineUserId: string; userId: string }>): Promise<any> {
    const machine = await this.machineRepo.findById({ id: machineId, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', machineId);
    for (const m of mappings) {
      machine.mapUser(m.machineUserId, m.userId);
    }
    await this.machineRepo.save(machine);
    return { mappedCount: mappings.length };
  }

  public async bulkStatus(organizationId: string): Promise<any[]> {
    const list = await this.machineRepo.findAll(organizationId);
    return list.map((m) => ({ id: m.id, serialNumber: m.serialNumber, status: m.status, connectionStatus: m.connectionStatus }));
  }

  public async getAnalytics(organizationId: string): Promise<any> {
    const machines = await this.machineRepo.findAll(organizationId);
    return {
      totalMachines: machines.length,
      onlineMachines: machines.filter((m) => m.connectionStatus === 'online').length,
      activeMachines: machines.filter((m) => m.status === 'active').length,
      machines: machines.map((m) => this.machineMapper.toDto(m)),
    };
  }

  public async getStatus(organizationId: string, id: string): Promise<any> {
    const machine = await this.machineRepo.findById({ id, organizationId });
    if (!machine) throw new NotFoundError('AttendanceMachine', id);
    return {
      machine: this.machineMapper.toDto(machine),
      isOnline: machine.connectionStatus === 'online',
    };
  }

  public async getMachineLogs(organizationId: string, id: string): Promise<any[]> {
    const logs = await this.logRepo.findAll(organizationId, { machineId: id });
    return logs.map((l) => this.logMapper.toDto(l));
  }

  public async getUnmappedUsers(organizationId: string): Promise<any[]> {
    return [];
  }

  // ====================================================
  // 4. GEOFENCES
  // ====================================================

  public async createGeoFence(organizationId: string, params: any): Promise<any> {
    const gf = GeoFence.create({ organizationId, ...params });
    await this.geoFenceRepo.save(gf);
    return this.geoFenceMapper.toDto(gf);
  }

  public async listGeoFences(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.geoFenceRepo.findAll(organizationId, filter);
    return list.map((g) => this.geoFenceMapper.toDto(g));
  }

  public async getGeoFenceById(organizationId: string, id: string): Promise<any> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    return this.geoFenceMapper.toDto(gf);
  }

  public async updateGeoFence(organizationId: string, id: string, params: any): Promise<any> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    gf.updateDetails(params);
    await this.geoFenceRepo.save(gf);
    return this.geoFenceMapper.toDto(gf);
  }

  public async deleteGeoFence(organizationId: string, id: string): Promise<void> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    await this.geoFenceRepo.delete({ id, organizationId });
  }

  public async getNearby(organizationId: string, latitude: number, longitude: number): Promise<any[]> {
    const all = await this.geoFenceRepo.findAll(organizationId, { isActive: true });
    return all.filter((g) => g.isPointInside(latitude, longitude)).map((g) => this.geoFenceMapper.toDto(g));
  }

  public async checkPoint(organizationId: string, id: string, latitude: number, longitude: number): Promise<{ inside: boolean }> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    return { inside: gf.isPointInside(latitude, longitude) };
  }

  public async getViolations(_organizationId: string): Promise<any[]> {
    return [];
  }

  public async getGeoFenceStats(organizationId: string, id: string): Promise<any> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    return { id: gf.id, name: gf.name, assignedUsersCount: gf.assignedUsers.length };
  }

  public async assignGeoFenceUsers(organizationId: string, id: string, userIds: string[]): Promise<any> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    gf.assignUsers(userIds);
    await this.geoFenceRepo.save(gf);
    return this.geoFenceMapper.toDto(gf);
  }

  public async assignGeoFenceDepartments(organizationId: string, id: string, departmentIds: string[]): Promise<any> {
    const gf = await this.geoFenceRepo.findById({ id, organizationId });
    if (!gf) throw new NotFoundError('GeoFence', id);
    gf.assignDepartments(departmentIds);
    await this.geoFenceRepo.save(gf);
    return this.geoFenceMapper.toDto(gf);
  }

  // ====================================================
  // 5. HOLIDAYS
  // ====================================================

  public async createHoliday(organizationId: string, params: any): Promise<any> {
    const holiday = Holiday.create({ organizationId, ...params });
    await this.holidayRepo.save(holiday);
    return this.holidayMapper.toDto(holiday);
  }

  public async listHolidays(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.holidayRepo.findAll(organizationId, filter);
    return list.map((h) => this.holidayMapper.toDto(h));
  }

  public async getHolidayById(organizationId: string, id: string): Promise<any> {
    const holiday = await this.holidayRepo.findById({ id, organizationId });
    if (!holiday) throw new NotFoundError('Holiday', id);
    return this.holidayMapper.toDto(holiday);
  }

  public async updateHoliday(organizationId: string, id: string, params: any): Promise<any> {
    const holiday = await this.holidayRepo.findById({ id, organizationId });
    if (!holiday) throw new NotFoundError('Holiday', id);
    holiday.updateDetails(params);
    await this.holidayRepo.save(holiday);
    return this.holidayMapper.toDto(holiday);
  }

  public async deleteHoliday(organizationId: string, id: string): Promise<void> {
    const holiday = await this.holidayRepo.findById({ id, organizationId });
    if (!holiday) throw new NotFoundError('Holiday', id);
    await this.holidayRepo.delete({ id, organizationId });
  }

  public async getUpcomingHolidays(organizationId: string): Promise<any[]> {
    const now = new Date();
    const list = await this.holidayRepo.findAll(organizationId, { year: now.getFullYear(), isActive: true });
    return list.filter((h) => h.date >= now).map((h) => this.holidayMapper.toDto(h));
  }

  public async getHolidaysByYear(organizationId: string, year: number): Promise<any[]> {
    const list = await this.holidayRepo.findByYear(organizationId, year);
    return list.map((h) => this.holidayMapper.toDto(h));
  }

  public async checkHolidayDate(organizationId: string, date: Date): Promise<{ isHoliday: boolean; holiday?: any }> {
    const h = await this.holidayRepo.findByDate(organizationId, date);
    return { isHoliday: h !== null, holiday: h ? this.holidayMapper.toDto(h) : undefined };
  }

  public async getHolidayStats(organizationId: string): Promise<any> {
    const now = new Date();
    const list = await this.holidayRepo.findByYear(organizationId, now.getFullYear());
    return {
      currentYear: now.getFullYear(),
      totalHolidays: list.length,
      upcomingCount: list.filter((h) => h.date >= now).length,
    };
  }

  public async exportHolidays(organizationId: string, year?: number): Promise<any[]> {
    const y = year ?? new Date().getFullYear();
    return this.getHolidaysByYear(organizationId, y);
  }

  public async bulkCreateHolidays(organizationId: string, holidays: any[]): Promise<{ count: number }> {
    const domainHolidays = holidays.map((h) => Holiday.create({ organizationId, ...h }));
    await this.holidayRepo.saveMany(domainHolidays);
    return { count: domainHolidays.length };
  }

  public async copyYearHolidays(organizationId: string, fromYear: number, toYear: number): Promise<{ copiedCount: number }> {
    const source = await this.holidayRepo.findByYear(organizationId, fromYear);
    const newHolidays: Holiday[] = [];
    for (const h of source) {
      const newDate = new Date(h.date);
      newDate.setUTCFullYear(toYear);
      newHolidays.push(
        Holiday.create({
          organizationId,
          name: h.name,
          date: newDate,
          description: h.description,
          holidayType: h.holidayType,
          isOptional: h.isOptional,
        })
      );
    }
    await this.holidayRepo.saveMany(newHolidays);
    return { copiedCount: newHolidays.length };
  }

  // ====================================================
  // 6. ATTENDANCE REQUESTS
  // ====================================================

  public async createRequest(organizationId: string, params: { userId: string; employeeId?: string; type: AttendanceRequestType; date: Date; requestedFirstIn?: Date; requestedLastOut?: Date; reason: string; assignedApprover: string }): Promise<any> {
    const req = AttendanceRequest.create({ organizationId, ...params });
    await this.requestRepo.save(req);
    return this.requestMapper.toDto(req);
  }

  public async listRequests(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.requestRepo.findAll(organizationId, filter);
    return list.map((r) => this.requestMapper.toDto(r));
  }

  public async getRequestById(organizationId: string, id: string): Promise<any> {
    const req = await this.requestRepo.findById({ id, organizationId });
    if (!req) throw new NotFoundError('AttendanceRequest', id);
    return this.requestMapper.toDto(req);
  }

  public async getMyAttendanceRequests(organizationId: string, userId: string): Promise<any[]> {
    const list = await this.requestRepo.findByUser(organizationId, userId);
    return list.map((r) => this.requestMapper.toDto(r));
  }

  public async cancelRequest(organizationId: string, id: string): Promise<any> {
    const req = await this.requestRepo.findById({ id, organizationId });
    if (!req) throw new NotFoundError('AttendanceRequest', id);
    req.cancel();
    await this.requestRepo.save(req);
    return this.requestMapper.toDto(req);
  }

  public async getPendingAttendanceApprovals(organizationId: string, approverId?: string): Promise<any[]> {
    if (approverId) {
      const list = await this.requestRepo.findByApprover(organizationId, approverId, 'pending');
      return list.map((r) => this.requestMapper.toDto(r));
    }
    const list = await this.requestRepo.findAll(organizationId, { status: 'pending' });
    return list.map((r) => this.requestMapper.toDto(r));
  }

  public async approveAttendanceRequest(organizationId: string, id: string, approverId: string): Promise<any> {
    const req = await this.requestRepo.findById({ id, organizationId });
    if (!req) throw new NotFoundError('AttendanceRequest', id);
    req.approve(approverId);
    await this.requestRepo.save(req);
    return this.requestMapper.toDto(req);
  }

  public async rejectAttendanceRequest(organizationId: string, id: string, approverId: string, reason?: string): Promise<any> {
    const req = await this.requestRepo.findById({ id, organizationId });
    if (!req) throw new NotFoundError('AttendanceRequest', id);
    req.reject(approverId, reason);
    await this.requestRepo.save(req);
    return this.requestMapper.toDto(req);
  }
}

import { ILeaveRequestRepository } from '../../domain/ports/ILeaveRequestRepository';
import { ILeaveBalanceRepository } from '../../domain/ports/ILeaveBalanceRepository';
import { LeaveRequest } from '../../domain/entities/LeaveRequest';
import { LeaveBalance } from '../../domain/entities/LeaveBalance';
import { LeaveRequestMapper } from '../mappers/LeaveRequestMapper';
import { LeaveBalanceMapper } from '../mappers/LeaveBalanceMapper';
import { LeaveType } from '../../domain/value-objects/HrmsEnums';
import { NotFoundError } from '../../../../shared/errors';

export class LeaveManagementUseCases {
  constructor(
    private readonly leaveRequestRepo: ILeaveRequestRepository,
    private readonly leaveRequestMapper: LeaveRequestMapper,
    private readonly leaveBalanceRepo: ILeaveBalanceRepository,
    private readonly leaveBalanceMapper: LeaveBalanceMapper
  ) {}

  // ----------------------------------------------------
  // LEAVE REQUESTS
  // ----------------------------------------------------

  public async createRequest(
    organizationId: string,
    params: {
      userId: string;
      employeeRef?: string;
      departmentId?: string;
      assignedApprover: string;
      leaveType: LeaveType;
      startDate: Date;
      endDate: Date;
      daysCount: number;
      startSession?: 'full' | 'first_half' | 'second_half';
      endSession?: 'full' | 'first_half' | 'second_half';
      reason: string;
    }
  ): Promise<any> {
    // 1. Verify balance if not unpaid leave
    const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const balance = await this.leaveBalanceRepo.findByUserAndYear(organizationId, params.userId, currentYear);
    if (balance && params.leaveType !== 'unpaid') {
      balance.debitLeave(params.leaveType, params.daysCount);
      await this.leaveBalanceRepo.save(balance);
    }

    // 2. Create request
    const request = LeaveRequest.create({
      organizationId,
      ...params,
    });

    await this.leaveRequestRepo.save(request);
    return this.leaveRequestMapper.toDto(request);
  }

  public async listRequests(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.leaveRequestRepo.findAll(organizationId, filter);
    return list.map((r) => this.leaveRequestMapper.toDto(r));
  }

  public async getRequestById(organizationId: string, id: string): Promise<any> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);
    return this.leaveRequestMapper.toDto(request);
  }

  public async updateRequest(
    organizationId: string,
    id: string,
    params: { startDate?: Date; endDate?: Date; daysCount?: number; reason?: string }
  ): Promise<any> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);

    request.updateDetails(params);
    await this.leaveRequestRepo.save(request);
    return this.leaveRequestMapper.toDto(request);
  }

  public async deleteRequest(organizationId: string, id: string): Promise<void> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);

    // If deleting a pending request, credit back the balance
    if (request.status === 'pending' && request.leaveType !== 'unpaid') {
      const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      const balance = await this.leaveBalanceRepo.findByUserAndYear(organizationId, request.userId, currentYear);
      if (balance) {
        balance.creditLeave(request.leaveType, request.daysCount);
        await this.leaveBalanceRepo.save(balance);
      }
    }

    await this.leaveRequestRepo.delete({ id, organizationId });
  }

  public async getMyRequests(organizationId: string, userId: string): Promise<any[]> {
    const requests = await this.leaveRequestRepo.findByUser(organizationId, userId);
    return requests.map((r) => this.leaveRequestMapper.toDto(r));
  }

  public async getPendingApprovals(organizationId: string, approverId?: string): Promise<any[]> {
    if (approverId) {
      const requests = await this.leaveRequestRepo.findByApprover(organizationId, approverId, 'pending');
      return requests.map((r) => this.leaveRequestMapper.toDto(r));
    }
    const requests = await this.leaveRequestRepo.findAll(organizationId, { status: 'pending' });
    return requests.map((r) => this.leaveRequestMapper.toDto(r));
  }

  public async getTeamCalendar(organizationId: string, departmentId?: string): Promise<any[]> {
    const approved = await this.leaveRequestRepo.findAll(organizationId, { status: 'approved', departmentId });
    return approved.map((r) => ({
      id: r.id,
      userId: r.userId,
      leaveType: r.leaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      daysCount: r.daysCount,
    }));
  }

  public async approveRequest(organizationId: string, id: string, approverId: string, comments?: string): Promise<any> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);

    request.approve(approverId, comments);
    await this.leaveRequestRepo.save(request);
    return this.leaveRequestMapper.toDto(request);
  }

  public async rejectRequest(organizationId: string, id: string, approverId: string, comments?: string): Promise<any> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);

    // Re-credit the balance
    if (request.leaveType !== 'unpaid') {
      const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      const balance = await this.leaveBalanceRepo.findByUserAndYear(organizationId, request.userId, currentYear);
      if (balance) {
        balance.creditLeave(request.leaveType, request.daysCount);
        await this.leaveBalanceRepo.save(balance);
      }
    }

    request.reject(approverId, comments);
    await this.leaveRequestRepo.save(request);
    return this.leaveRequestMapper.toDto(request);
  }

  public async escalateRequest(organizationId: string, id: string, escalatedTo: string, reason: string): Promise<any> {
    const request = await this.leaveRequestRepo.findById({ id, organizationId });
    if (!request) throw new NotFoundError('LeaveRequest', id);

    request.escalate(escalatedTo, reason);
    await this.leaveRequestRepo.save(request);
    return this.leaveRequestMapper.toDto(request);
  }

  public async bulkApprove(organizationId: string, requestIds: string[], approverId: string): Promise<any[]> {
    const results: any[] = [];
    for (const id of requestIds) {
      const updated = await this.approveRequest(organizationId, id, approverId);
      results.push(updated);
    }
    return results;
  }

  public async getLeaveAnalytics(organizationId: string): Promise<any> {
    const all = await this.leaveRequestRepo.findAll(organizationId);
    return {
      totalRequests: all.length,
      approved: all.filter((r) => r.status === 'approved').length,
      pending: all.filter((r) => r.status === 'pending').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    };
  }

  // ----------------------------------------------------
  // LEAVE BALANCES
  // ----------------------------------------------------

  public async getMyBalance(organizationId: string, userId: string, financialYear?: string): Promise<any> {
    const fYear = financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    let balance = await this.leaveBalanceRepo.findByUserAndYear(organizationId, userId, fYear);
    if (!balance) {
      // Auto-initialize if absent
      balance = LeaveBalance.create({ organizationId, userId, financialYear: fYear });
      await this.leaveBalanceRepo.save(balance);
    }
    return this.leaveBalanceMapper.toDto(balance);
  }

  public async getBalanceSummary(organizationId: string, userId?: string, financialYear?: string): Promise<any> {
    const fYear = financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    if (userId) {
      const b = await this.getMyBalance(organizationId, userId, fYear);
      return b;
    }
    const all = await this.leaveBalanceRepo.findAll(organizationId, { financialYear: fYear });
    return all.map((b) => this.leaveBalanceMapper.toDto(b));
  }

  public async getLeaveBalanceReport(organizationId: string, financialYear?: string): Promise<any[]> {
    const fYear = financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const all = await this.leaveBalanceRepo.findAll(organizationId, { financialYear: fYear });
    return all.map((b) => this.leaveBalanceMapper.toDto(b));
  }

  public async getUtilizationTrends(organizationId: string): Promise<any> {
    const balances = await this.leaveBalanceRepo.findAll(organizationId);
    return {
      totalEmployeesTracked: balances.length,
      trends: [],
    };
  }

  public async initializeBalance(
    organizationId: string,
    params: { userId: string; financialYear: string; casualLeaveTotal?: number; sickLeaveTotal?: number; earnedLeaveTotal?: number }
  ): Promise<any> {
    const balance = LeaveBalance.create({
      organizationId,
      userId: params.userId,
      financialYear: params.financialYear,
      casualLeaveTotal: params.casualLeaveTotal,
      sickLeaveTotal: params.sickLeaveTotal,
      earnedLeaveTotal: params.earnedLeaveTotal,
    });

    await this.leaveBalanceRepo.save(balance);
    return this.leaveBalanceMapper.toDto(balance);
  }

  public async bulkInitialize(
    organizationId: string,
    params: { userIds: string[]; financialYear: string }
  ): Promise<{ initializedCount: number }> {
    for (const u of params.userIds) {
      const balance = LeaveBalance.create({
        organizationId,
        userId: u,
        financialYear: params.financialYear,
      });
      await this.leaveBalanceRepo.save(balance);
    }
    return { initializedCount: params.userIds.length };
  }

  public async accrueMonthly(organizationId: string, financialYear?: string, amount?: number): Promise<{ accruedCount: number }> {
    const fYear = financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const all = await this.leaveBalanceRepo.findAll(organizationId, { financialYear: fYear });
    for (const b of all) {
      b.accrueMonthly(amount ?? 1.5);
      await this.leaveBalanceRepo.save(b);
    }
    return { accruedCount: all.length };
  }

  public async listBalances(organizationId: string, filter?: any): Promise<any[]> {
    const all = await this.leaveBalanceRepo.findAll(organizationId, filter);
    return all.map((b) => this.leaveBalanceMapper.toDto(b));
  }

  public async getBalanceById(organizationId: string, id: string): Promise<any> {
    const balance = await this.leaveBalanceRepo.findById({ id, organizationId });
    if (!balance) throw new NotFoundError('LeaveBalance', id);
    return this.leaveBalanceMapper.toDto(balance);
  }

  public async updateBalance(
    organizationId: string,
    id: string,
    params: Partial<Record<LeaveType, number>>
  ): Promise<any> {
    const balance = await this.leaveBalanceRepo.findById({ id, organizationId });
    if (!balance) throw new NotFoundError('LeaveBalance', id);

    balance.updateTotals(params);
    await this.leaveBalanceRepo.save(balance);
    return this.leaveBalanceMapper.toDto(balance);
  }
}

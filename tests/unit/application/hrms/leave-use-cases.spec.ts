import { LeaveManagementUseCases } from '../../../../src/modules/hrms/application/use-cases/LeaveManagementUseCases';
import { InMemoryLeaveRequestRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryLeaveRequestRepository';
import { InMemoryLeaveBalanceRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryLeaveBalanceRepository';
import { LeaveRequestMapper } from '../../../../src/modules/hrms/application/mappers/LeaveRequestMapper';
import { LeaveBalanceMapper } from '../../../../src/modules/hrms/application/mappers/LeaveBalanceMapper';
import { NotFoundError } from '../../../../src/shared/errors';

describe('LeaveManagementUseCases (Unit Tests)', () => {
  let leaveRequestRepo: InMemoryLeaveRequestRepository;
  let leaveBalanceRepo: InMemoryLeaveBalanceRepository;
  let leaveRequestMapper: LeaveRequestMapper;
  let leaveBalanceMapper: LeaveBalanceMapper;
  let useCases: LeaveManagementUseCases;

  const orgId = 'org-leave-test';
  const userId = 'usr-emp-101';
  const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  beforeEach(() => {
    leaveRequestRepo = new InMemoryLeaveRequestRepository();
    leaveBalanceRepo = new InMemoryLeaveBalanceRepository();
    leaveRequestMapper = new LeaveRequestMapper();
    leaveBalanceMapper = new LeaveBalanceMapper();

    useCases = new LeaveManagementUseCases(
      leaveRequestRepo,
      leaveRequestMapper,
      leaveBalanceRepo,
      leaveBalanceMapper
    );
  });

  describe('Leave Balances', () => {
    it('should initialize and fetch employee balance', async () => {
      const balance = await useCases.initializeBalance(orgId, {
        userId,
        financialYear: currentYear,
        casualLeaveTotal: 12,
        sickLeaveTotal: 10,
        earnedLeaveTotal: 15,
      });

      expect(balance.userId).toBe(userId);
      expect(balance.casualLeave.total).toBe(12);
      expect(balance.casualLeave.used).toBe(0);

      const myBalance = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(myBalance.sickLeave.total).toBe(10);
    });

    it('should accrue monthly earned leaves across all balances', async () => {
      await useCases.initializeBalance(orgId, {
        userId: 'usr-1',
        financialYear: currentYear,
        earnedLeaveTotal: 10,
      });
      await useCases.initializeBalance(orgId, {
        userId: 'usr-2',
        financialYear: currentYear,
        earnedLeaveTotal: 5,
      });

      const res = await useCases.accrueMonthly(orgId, currentYear, 1.75);
      expect(res.accruedCount).toBe(2);

      const b1 = await useCases.getMyBalance(orgId, 'usr-1', currentYear);
      expect(b1.earnedLeave.total).toBe(11.75);
    });
  });

  describe('Leave Requests & Workflow', () => {
    beforeEach(async () => {
      await useCases.initializeBalance(orgId, {
        userId,
        financialYear: currentYear,
        casualLeaveTotal: 10,
        sickLeaveTotal: 10,
      });
    });

    it('should debit balance upon creating paid leave request', async () => {
      const start = new Date(2026, 5, 1);
      const end = new Date(2026, 5, 2);

      const req = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'casual',
        startDate: start,
        endDate: end,
        daysCount: 2,
        reason: 'Personal urgent work',
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe('pending');
      expect(req.daysCount).toBe(2);

      // Check balance was debited
      const balance = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(balance.casualLeave.used).toBe(2);
    });

    it('should approve leave request', async () => {
      const start = new Date(2026, 5, 10);
      const end = new Date(2026, 5, 11);

      const req = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'casual',
        startDate: start,
        endDate: end,
        daysCount: 2,
        reason: 'Travel',
      });

      const approved = await useCases.approveRequest(orgId, req.id, 'usr-manager', 'Approved with pleasure');
      expect(approved.status).toBe('approved');
      expect(approved.assignedApprover).toBe('usr-manager');
    });

    it('should restore leave balance when request is rejected', async () => {
      const req = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'casual',
        startDate: new Date(),
        endDate: new Date(),
        daysCount: 3,
        reason: 'Vacation',
      });

      let bal = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(bal.casualLeave.used).toBe(3);

      const rejected = await useCases.rejectRequest(orgId, req.id, 'usr-manager', 'Insufficient coverage');
      expect(rejected.status).toBe('rejected');

      bal = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(bal.casualLeave.used).toBe(0);
    });

    it('should restore leave balance when pending request is deleted', async () => {
      const req = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'sick',
        startDate: new Date(),
        endDate: new Date(),
        daysCount: 2,
        reason: 'Flu',
      });

      let bal = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(bal.sickLeave.used).toBe(2);

      await useCases.deleteRequest(orgId, req.id);

      bal = await useCases.getMyBalance(orgId, userId, currentYear);
      expect(bal.sickLeave.used).toBe(0);
    });

    it('should throw NotFoundError for non-existent request', async () => {
      await expect(useCases.getRequestById(orgId, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should calculate leave analytics correctly', async () => {
      const req1 = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'casual',
        startDate: new Date(),
        endDate: new Date(),
        daysCount: 1,
        reason: 'R1',
      });

      const req2 = await useCases.createRequest(orgId, {
        userId,
        assignedApprover: 'usr-manager',
        leaveType: 'casual',
        startDate: new Date(),
        endDate: new Date(),
        daysCount: 1,
        reason: 'R2',
      });

      await useCases.approveRequest(orgId, req1.id, 'usr-manager');

      const analytics = await useCases.getLeaveAnalytics(orgId);
      expect(analytics.totalRequests).toBe(2);
      expect(analytics.approved).toBe(1);
      expect(analytics.pending).toBe(1);
      expect(analytics.rejected).toBe(0);
    });
  });
});

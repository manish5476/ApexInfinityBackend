import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { DepartmentController } from '../controllers/department.controller';
import { DesignationController } from '../controllers/designation.controller';
import { CompanyAssetController } from '../controllers/company-asset.controller';
import { EmployeeDocumentController } from '../controllers/employee-document.controller';
import { ShiftController } from '../controllers/shift.controller';
import { ShiftGroupController } from '../controllers/shift-group.controller';
import { LeaveRequestController } from '../controllers/leave-request.controller';
import { LeaveBalanceController } from '../controllers/leave-balance.controller';
import { AttendanceController } from '../controllers/attendance.controller';
import { AttendanceLogController } from '../controllers/attendance-log.controller';
import { AttendanceDailyController } from '../controllers/attendance-daily.controller';
import { AttendanceMachineController } from '../controllers/attendance-machine.controller';
import { GeoFenceController } from '../controllers/geofence.controller';
import { HolidayController } from '../controllers/holiday.controller';
import { AttendanceRequestController } from '../controllers/attendance-request.controller';
import { PayrollController } from '../controllers/payroll.controller';
import { SalaryStructureController } from '../controllers/salary-structure.controller';
import { ExpenseClaimController } from '../controllers/expense-claim.controller';

import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export interface HrmsControllers {
  employeeController: EmployeeController;
  departmentController: DepartmentController;
  designationController?: DesignationController;
  companyAssetController?: CompanyAssetController;
  employeeDocumentController?: EmployeeDocumentController;
  shiftController?: ShiftController;
  shiftGroupController?: ShiftGroupController;
  leaveRequestController?: LeaveRequestController;
  leaveBalanceController?: LeaveBalanceController;
  attendanceController: AttendanceController;
  attendanceLogController?: AttendanceLogController;
  attendanceDailyController?: AttendanceDailyController;
  attendanceMachineController?: AttendanceMachineController;
  geofenceController?: GeoFenceController;
  holidayController?: HolidayController;
  attendanceRequestController?: AttendanceRequestController;
  payrollController?: PayrollController;
  salaryStructureController?: SalaryStructureController;
  expenseClaimController?: ExpenseClaimController;
}

export function createHrmsRoutes(
  controllers: HrmsControllers,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  // Health check specific to HRMS (unprotected)
  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'HRMS API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Machine hardware endpoints (unprotected by JWT, auth done by header/key)
  if (controllers.attendanceMachineController) {
    router.post('/attendance/machines/:id/ping', controllers.attendanceMachineController.ping);
    router.post('/attendance/machines/:id/sync', controllers.attendanceMachineController.sync);
  }
  if (controllers.attendanceLogController) {
    router.post('/attendance/logs/bulk', controllers.attendanceLogController.bulkCreate);
  }

  // Apply authentication guard to all protected HRMS endpoints
  router.use(authGuard);

  // ==========================================
  // 1. Departments
  // ==========================================
  const dept = controllers.departmentController;
  router.get('/departments', dept.list);
  router.post('/departments', dept.create);
  router.get('/departments/hierarchy', dept.getHierarchy);
  router.get('/departments/stats', dept.getStats);
  router.get('/departments/stats/summary', dept.getStats);
  router.post('/departments/bulk', dept.bulkCreate);
  router.get('/departments/:id', dept.getById);
  router.patch('/departments/:id', dept.update);
  router.put('/departments/:id', dept.update);
  router.delete('/departments/:id', dept.delete);
  router.get('/departments/:id/employees', dept.getEmployees);

  // ==========================================
  // 2. Designations
  // ==========================================
  if (controllers.designationController) {
    const desig = controllers.designationController;
    router.get('/designations', desig.list);
    router.post('/designations', desig.create);
    router.get('/designations/hierarchy', desig.getHierarchy);
    router.get('/designations/career-path/:id', desig.getCareerPath);
    router.get('/designations/salary-bands', desig.getSalaryBands);
    router.get('/designations/promotion-eligible', desig.getPromotionEligible);
    router.post('/designations/bulk', desig.bulkCreate);
    router.get('/designations/:id', desig.getById);
    router.patch('/designations/:id', desig.update);
    router.put('/designations/:id', desig.update);
    router.delete('/designations/:id', desig.delete);
    router.get('/designations/:id/career-path', desig.getCareerPath);
    router.get('/designations/:id/employees', desig.getEmployees);
  }

  // ==========================================
  // 3. Employees
  // ==========================================
  const emp = controllers.employeeController;
  router.get('/employees/me/profile', emp.getMyProfile);
  router.get('/employees/by-user/:userId', emp.getByUserId);
  router.get('/employees/workspace/:id', emp.getWorkspace360);
  router.get('/employees/:id/workspace', emp.getWorkspace360);
  router.post('/employees/:id/invite-user', emp.inviteUser);
  router.patch('/employees/:id/deactivate', emp.deactivate);
  router.get('/employees', emp.list);
  router.post('/employees', emp.create);
  router.get('/employees/:id', emp.getById);
  router.patch('/employees/:id', emp.update);
  router.put('/employees/:id', emp.update);

  // ==========================================
  // 4. Company Assets
  // ==========================================
  if (controllers.companyAssetController) {
    const asset = controllers.companyAssetController;
    router.get('/assets', asset.list);
    router.post('/assets', asset.create);
    router.get('/assets/:id', asset.getById);
    router.patch('/assets/:id', asset.update);
    router.put('/assets/:id', asset.update);
    router.post('/assets/:id/assign', asset.assign);
    router.post('/assets/:id/return', asset.return);
  }

  // ==========================================
  // 5. Employee Documents
  // ==========================================
  if (controllers.employeeDocumentController) {
    const doc = controllers.employeeDocumentController;
    router.get('/documents', doc.list);
    router.post('/documents', doc.create);
    router.get('/documents/:id', doc.getById);
    router.patch('/documents/:id/verify', doc.verify);
    router.delete('/documents/:id', doc.delete);
  }

  // ==========================================
  // 6. Shifts
  // ==========================================
  if (controllers.shiftController) {
    const shift = controllers.shiftController;
    router.get('/shifts/timeline', shift.getTimeline);
    router.get('/shifts/coverage', shift.getCoverage);
    router.post('/shifts/calculate-hours', shift.calculateHours);
    router.post('/shifts/validate-assignment', shift.validateAssignment);
    router.post('/shifts/:id/clone', shift.clone);
    router.get('/shifts/:id/assignments', shift.getAssignments);
    router.get('/shifts', shift.list);
    router.post('/shifts', shift.create);
    router.get('/shifts/:id', shift.getById);
    router.patch('/shifts/:id', shift.update);
    router.put('/shifts/:id', shift.update);
    router.delete('/shifts/:id', shift.delete);
  }

  // ==========================================
  // 7. Shift Groups
  // ==========================================
  if (controllers.shiftGroupController) {
    const sg = controllers.shiftGroupController;
    router.post('/shift-groups/:id/generate-schedule', sg.generateSchedule);
    router.post('/shift-groups/:id/assign', sg.assign);
    router.get('/shift-groups/:id/assignments', sg.getAssignments);
    router.get('/shift-groups', sg.list);
    router.post('/shift-groups', sg.create);
    router.get('/shift-groups/:id', sg.getById);
    router.patch('/shift-groups/:id', sg.update);
    router.put('/shift-groups/:id', sg.update);
    router.delete('/shift-groups/:id', sg.delete);
  }

  // ==========================================
  // 8. Leave Requests
  // ==========================================
  if (controllers.leaveRequestController) {
    const lr = controllers.leaveRequestController;
    router.get('/leave-requests/my-requests', lr.getMyRequests);
    router.get('/leave-requests/balance-summary', lr.getBalanceSummary);
    router.get('/leave-requests/pending-approvals', lr.getPendingApprovals);
    router.get('/leave-requests/team-calendar', lr.getTeamCalendar);
    router.get('/leave-requests/analytics', lr.getAnalytics);
    router.post('/leave-requests/bulk-approve', lr.bulkApprove);
    router.patch('/leave-requests/:id/approve', lr.approve);
    router.patch('/leave-requests/:id/reject', lr.reject);
    router.patch('/leave-requests/:id/escalate', lr.escalate);
    router.get('/leave-requests', lr.list);
    router.post('/leave-requests', lr.create);
    router.get('/leave-requests/:id', lr.getById);
    router.patch('/leave-requests/:id', lr.update);
    router.put('/leave-requests/:id', lr.update);
    router.delete('/leave-requests/:id', lr.delete);
  }

  // ==========================================
  // 9. Leave Balances
  // ==========================================
  if (controllers.leaveBalanceController) {
    const lb = controllers.leaveBalanceController;
    router.get('/leave-balances/my-balance', lb.getMyBalance);
    router.get('/leave-balances/report', lb.getReport);
    router.get('/leave-balances/utilization-trends', lb.getUtilizationTrends);
    router.post('/leave-balances/initialize', lb.initialize);
    router.post('/leave-balances/bulk-initialize', lb.bulkInitialize);
    router.post('/leave-balances/accrue-monthly', lb.accrueMonthly);
    router.get('/leave-balances', lb.list);
    router.get('/leave-balances/:id', lb.getById);
    router.patch('/leave-balances/:id', lb.update);
    router.put('/leave-balances/:id', lb.update);
  }

  // ==========================================
  // 10. Attendance Punch & Logs
  // ==========================================
  router.post('/attendance/punch', controllers.attendanceController.recordPunch);

  if (controllers.attendanceLogController) {
    const al = controllers.attendanceLogController;
    router.get('/attendance/logs/my-logs', al.getMyLogs);
    router.get('/attendance/logs/stats', al.getStats);
    router.get('/attendance/logs/realtime-feed', al.getRealtimeFeed);
    router.get('/attendance/logs/user/:userId', al.getUserLogs);
    router.patch('/attendance/logs/:id/verify', al.verify);
    router.patch('/attendance/logs/:id/flag', al.flag);
    router.patch('/attendance/logs/:id/correct', al.correct);
    router.get('/attendance/logs', al.list);
    router.post('/attendance/logs', al.create);
    router.get('/attendance/logs/:id', al.getById);
  }

  // ==========================================
  // 11. Daily Attendance
  // ==========================================
  if (controllers.attendanceDailyController) {
    const ad = controllers.attendanceDailyController;
    router.get('/attendance/daily/my-attendance', ad.getMyAttendance);
    router.get('/attendance/daily/today', ad.getToday);
    router.get('/attendance/daily/dashboard', ad.getDashboard);
    router.get('/attendance/daily/report', ad.getReport);
    router.get('/attendance/daily/trends', ad.getTrends);
    router.get('/attendance/daily/export', ad.exportData);
    router.post('/attendance/daily/recalculate', ad.recalculate);
    router.post('/attendance/daily/bulk-update', ad.bulkUpdate);
    router.patch('/attendance/daily/:id/regularize', ad.regularize);
    router.get('/attendance/daily', ad.list);
    router.get('/attendance/daily/:id', ad.getById);
  }

  // ==========================================
  // 12. Attendance Biometric Machines
  // ==========================================
  if (controllers.attendanceMachineController) {
    const am = controllers.attendanceMachineController;
    router.get('/attendance/machines/unmapped-users', am.getUnmappedUsers);
    router.post('/attendance/machines/map-user', am.mapUser);
    router.post('/attendance/machines/bulk-map', am.bulkMapUsers);
    router.post('/attendance/machines/bulk-status', am.bulkStatus);
    router.get('/attendance/machines/analytics', am.getAnalytics);
    router.get('/attendance/machines/:id/status', am.getStatus);
    router.get('/attendance/machines/:id/logs', am.getLogs);
    router.post('/attendance/machines/:id/test-connection', am.testConnection);
    router.post('/attendance/machines/:id/regenerate-key', am.regenerateApiKey);
    router.get('/attendance/machines', am.list);
    router.post('/attendance/machines', am.create);
    router.get('/attendance/machines/:id', am.getById);
    router.patch('/attendance/machines/:id', am.update);
    router.put('/attendance/machines/:id', am.update);
    router.delete('/attendance/machines/:id', am.delete);
  }

  // ==========================================
  // 13. Geofences
  // ==========================================
  if (controllers.geofenceController) {
    const gf = controllers.geofenceController;
    router.post('/attendance/geofences/nearby', gf.findNearby);
    router.post('/attendance/geofences/:id/check-point', gf.checkPoint);
    router.get('/attendance/geofences/violations', gf.getViolations);
    router.get('/attendance/geofences/:id/stats', gf.getStats);
    router.post('/attendance/geofences/:id/assign-users', gf.assignUsers);
    router.post('/attendance/geofences/:id/assign-departments', gf.assignDepartments);
    router.get('/attendance/geofences', gf.list);
    router.post('/attendance/geofences', gf.create);
    router.get('/attendance/geofences/:id', gf.getById);
    router.patch('/attendance/geofences/:id', gf.update);
    router.put('/attendance/geofences/:id', gf.update);
    router.delete('/attendance/geofences/:id', gf.delete);
  }

  // ==========================================
  // 14. Holidays
  // ==========================================
  if (controllers.holidayController) {
    const hol = controllers.holidayController;
    router.get('/attendance/holidays/upcoming', hol.getUpcoming);
    router.get('/attendance/holidays/year/:year', hol.getByYear);
    router.post('/attendance/holidays/check-date', hol.checkDate);
    router.get('/attendance/holidays/stats', hol.getStats);
    router.get('/attendance/holidays/export', hol.exportData);
    router.post('/attendance/holidays/bulk', hol.bulkCreate);
    router.post('/attendance/holidays/copy-year', hol.copyYear);
    router.get('/attendance/holidays', hol.list);
    router.post('/attendance/holidays', hol.create);
    router.get('/attendance/holidays/:id', hol.getById);
    router.patch('/attendance/holidays/:id', hol.update);
    router.put('/attendance/holidays/:id', hol.update);
    router.delete('/attendance/holidays/:id', hol.delete);
  }

  // ==========================================
  // 15. Attendance Requests
  // ==========================================
  if (controllers.attendanceRequestController) {
    const ar = controllers.attendanceRequestController;
    router.get('/attendance-requests/my-requests', ar.getMyRequests);
    router.get('/attendance-requests/pending-approvals', ar.getPendingApprovals);
    router.patch('/attendance-requests/:id/cancel', ar.cancel);
    router.patch('/attendance-requests/:id/approve', ar.approve);
    router.patch('/attendance-requests/:id/reject', ar.reject);
    router.get('/attendance-requests', ar.list);
    router.post('/attendance-requests', ar.create);
    router.get('/attendance-requests/:id', ar.getById);
  }

  // ==========================================
  // 16. Payroll Runs & Payslips
  // ==========================================
  if (controllers.payrollController) {
    const pr = controllers.payrollController;
    router.post('/payroll/runs', pr.runMonthlyPayroll);
    router.patch('/payroll/payslips/bulk-status', pr.bulkUpdateStatus);
    router.get('/payroll/my-payslips', pr.getMyPayslips);
    router.get('/payroll/payslips', pr.getPayslipList);
    router.get('/payroll/payslips/:id', pr.getPayslip);
    router.patch('/payroll/payslips/:id', pr.updatePayslipStatus);
    router.put('/payroll/payslips/:id', pr.updatePayslipStatus);
  }

  // ==========================================
  // 17. Salary Structures
  // ==========================================
  if (controllers.salaryStructureController) {
    const ss = controllers.salaryStructureController;
    router.get('/salary-structures', ss.list);
    router.post('/salary-structures', ss.create);
    router.get('/salary-structures/:id', ss.getById);
    router.patch('/salary-structures/:id', ss.update);
    router.put('/salary-structures/:id', ss.update);
    router.delete('/salary-structures/:id', ss.delete);
  }

  // ==========================================
  // 18. Expense Claims
  // ==========================================
  if (controllers.expenseClaimController) {
    const ec = controllers.expenseClaimController;
    router.get('/expenses', ec.list);
    router.post('/expenses', ec.create);
    router.get('/expenses/:id', ec.getById);
    router.patch('/expenses/:id', ec.update);
    router.put('/expenses/:id', ec.update);
    router.delete('/expenses/:id', ec.delete);
    router.patch('/expenses/:id/approve', ec.approve);
    router.patch('/expenses/:id/reject', ec.reject);
  }

  return router;
}

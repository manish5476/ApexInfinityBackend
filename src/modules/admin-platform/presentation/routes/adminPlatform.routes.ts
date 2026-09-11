import { Router } from 'express';
import { AdminPlatformController } from '../controllers/adminPlatform.controller';

export function createAdminPlatformRouter(ctrl: AdminPlatformController): Router {
  const router = Router();

  // Dashboard & Reports
  router.get('/dashboard', ctrl.dashboard);
  router.get('/analytics/realtime', ctrl.dashboard);
  router.post('/reports', ctrl.generateReport);

  // Admins & Users
  router.get('/admins', ctrl.listAdmins);
  router.post('/admins', ctrl.createAdmin);
  router.get('/users', ctrl.listUsers);
  router.patch('/users/:userId/status', ctrl.updateUserStatus);
  router.post('/users/:userId/block', ctrl.blockUser);
  router.post('/users/:userId/unblock', ctrl.unblockUser);
  router.post('/users/:userId/roles', ctrl.assignRole);
  router.get('/users/:userId/sessions', ctrl.userSessions);
  router.delete('/users/:userId/sessions', ctrl.revokeUserSessions);
  router.post('/users/:userId/impersonate', ctrl.impersonateUser);

  // Roles & Permissions
  router.get('/roles', ctrl.roles);
  router.get('/permissions', ctrl.permissions);

  // Settings & Feature Flags
  router.get('/settings', ctrl.settings);
  router.post('/settings', ctrl.upsertSetting);
  router.get('/feature-flags', ctrl.featureFlags);
  router.post('/feature-flags', ctrl.upsertFeatureFlag);

  // Security & Audit
  router.get('/security/suspicious-activity', ctrl.suspiciousActivity);
  router.get('/audit', ctrl.auditLogs);

  // Developer Tools
  router.get('/developer/database-inspector', ctrl.databaseInspector);
  router.post('/developer/cache/clear', ctrl.clearCache);
  router.get('/developer/logs', ctrl.logs);
  router.post('/developer/api-tester', ctrl.apiTester);
  router.get('/developer/queues', ctrl.queueMonitor);

  return router;
}

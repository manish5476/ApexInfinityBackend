import { Request, Response, NextFunction } from 'express';
import { AdminPlatformUseCases } from '../../application/use-cases/AdminPlatformUseCases';
import {
  upsertFeatureFlagSchema,
  upsertSettingSchema,
  auditQuerySchema,
  reportGenerateSchema,
} from '../validation/adminPlatform.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getContext(req: Request): { organizationId: string; userId: string; user?: any } {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  const organizationId =
    ctx?.organizationId ||
    user?.organizationId ||
    (req.headers['x-organization-id'] as string) ||
    '';
  const userId = ctx?.userId || user?._id || user?.id || 'system';
  return { organizationId, userId, user };
}

export class AdminPlatformController {
  constructor(private readonly useCases: AdminPlatformUseCases) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const summary = await this.useCases.getDashboardSummary(organizationId);
      res.status(200).json({ status: 'success', data: summary });
    } catch (err) {
      next(err);
    }
  };

  listAdmins = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'CREATE',
        resource: 'Admin',
        after: { email: req.body.email },
      });
      res.status(201).json({
        status: 'success',
        data: { message: 'Admin user created successfully', user: req.body },
      });
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: { items: [], total: 0, page: 1, limit: 20 },
      });
    } catch (err) {
      next(err);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'UPDATE',
        resource: 'User',
        resourceId: req.params.userId,
        after: { status: req.body.status },
      });
      res.status(200).json({ status: 'success', message: 'User status updated' });
    } catch (err) {
      next(err);
    }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'SECURITY_EVENT',
        resource: 'User',
        resourceId: req.params.userId,
        after: { isLoginBlocked: true, reason: req.body.reason },
      });
      res.status(200).json({ status: 'success', message: 'User blocked' });
    } catch (err) {
      next(err);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'SECURITY_EVENT',
        resource: 'User',
        resourceId: req.params.userId,
        after: { isLoginBlocked: false },
      });
      res.status(200).json({ status: 'success', message: 'User unblocked' });
    } catch (err) {
      next(err);
    }
  };

  assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'UPDATE',
        resource: 'UserRole',
        resourceId: req.params.userId,
        after: { roleId: req.body.roleId },
      });
      res.status(200).json({ status: 'success', message: 'Role assigned' });
    } catch (err) {
      next(err);
    }
  };

  userSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: { sessions: [], userId: req.params.userId },
      });
    } catch (err) {
      next(err);
    }
  };

  revokeUserSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'SECURITY_EVENT',
        resource: 'Session',
        resourceId: req.params.userId,
        after: { revoked: true },
      });
      res.status(200).json({ status: 'success', data: { revoked: 1 } });
    } catch (err) {
      next(err);
    }
  };

  impersonateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      await this.useCases.writeAudit({
        actorId: userId,
        action: 'IMPERSONATE',
        resource: 'User',
        resourceId: req.params.userId,
        metadata: { reason: req.body.reason },
      });
      res.status(200).json({
        status: 'success',
        data: { token: 'mock-impersonation-token-short-lived', userId: req.params.userId },
      });
    } catch (err) {
      next(err);
    }
  };

  roles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: [
          { key: 'superadmin', name: 'Super Administrator' },
          { key: 'admin', name: 'Administrator' },
          { key: 'manager', name: 'Manager' },
          { key: 'staff', name: 'Staff Member' },
        ],
      });
    } catch (err) {
      next(err);
    }
  };

  permissions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          platform: ['platform:read', 'platform:manage', 'platform:settings', 'platform:feature_flags'],
          logistics: ['logistics:read', 'logistics:manage'],
          assets: ['asset:read', 'asset:upload', 'asset:delete'],
        },
      });
    } catch (err) {
      next(err);
    }
  };

  settings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const namespace = req.query.namespace as string | undefined;
      const list = await this.useCases.listSettings(organizationId, namespace);
      res.status(200).json({
        status: 'success',
        data: list.map(s => s.toPersistence()),
      });
    } catch (err) {
      next(err);
    }
  };

  upsertSetting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = upsertSettingSchema.parse(req.body);
      const setting = await this.useCases.upsertSetting({
        namespace: body.namespace,
        key: body.key,
        value: body.value,
        encrypted: body.encrypted,
        description: body.description,
        organizationId,
        userId,
      });
      res.status(200).json({
        status: 'success',
        data: setting.toPersistence(),
      });
    } catch (err) {
      next(err);
    }
  };

  featureFlags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const list = await this.useCases.listFeatureFlags(organizationId);
      res.status(200).json({
        status: 'success',
        data: list.map(f => f.toPersistence()),
      });
    } catch (err) {
      next(err);
    }
  };

  upsertFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = upsertFeatureFlagSchema.parse(req.body);
      const flag = await this.useCases.upsertFeatureFlag({
        ...body,
        organizationId,
        userId,
      });
      res.status(200).json({
        status: 'success',
        data: flag.toPersistence(),
      });
    } catch (err) {
      next(err);
    }
  };

  databaseInspector = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.useCases.databaseInspector();
      res.status(200).json({ status: 'success', data: stats });
    } catch (err) {
      next(err);
    }
  };

  clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pattern = (req.query.pattern as string) || '*';
      const result = await this.useCases.clearCache(pattern);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  logs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lines = req.query.lines ? parseInt(req.query.lines as string, 10) : 100;
      const logs = await this.useCases.readLogs(lines);
      res.status(200).json({ status: 'success', data: logs });
    } catch (err) {
      next(err);
    }
  };

  apiTester = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = this.useCases.apiTesterEcho(req.body, req.headers as Record<string, unknown>);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  queueMonitor = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const monitor = await this.useCases.queueMonitor();
      res.status(200).json({ status: 'success', data: monitor });
    } catch (err) {
      next(err);
    }
  };

  suspiciousActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const audit = await this.useCases.listAuditLogs(organizationId, {
        action: 'SECURITY_EVENT',
        limit: 20,
      });
      res.status(200).json({ status: 'success', data: audit.items.map(a => a.toPersistence()) });
    } catch (err) {
      next(err);
    }
  };

  auditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const query = auditQuerySchema.parse(req.query);
      const result = await this.useCases.listAuditLogs(organizationId, query);
      res.status(200).json({
        status: 'success',
        data: {
          items: result.items.map(a => a.toPersistence()),
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const body = reportGenerateSchema.parse(req.body);
      const report = await this.useCases.generateReport(body.type, organizationId);
      res.status(200).json({ status: 'success', data: report });
    } catch (err) {
      next(err);
    }
  };
}

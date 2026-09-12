import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { SessionDocument } from '../../infrastructure/persistence';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../shared/errors';

export class SessionController {
  private readonly sessionModel: Model<SessionDocument>;

  constructor(sessionModel: Model<SessionDocument>) {
    this.sessionModel = sessionModel;
  }

  public mySessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const sessions = await this.sessionModel
        .find({ userId: user.id })
        .sort({ lastActivityAt: -1 })
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  };

  public listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const orgId = user.organizationId;
      const { userId, isValid, device, browser, ipAddress, startDate, endDate } = req.query;

      const filter: Record<string, unknown> = {};
      if (orgId && !user.roles.includes('superadmin')) {
        filter.organizationId = orgId;
      }
      if (userId) filter.userId = userId;
      if (isValid !== undefined) filter.isValid = isValid === 'true';
      if (device) filter.deviceType = { $regex: String(device), $options: 'i' };
      if (browser) filter.browser = String(browser);
      if (ipAddress) filter.ipAddress = String(ipAddress);

      if (startDate || endDate) {
        const dateFilter: Record<string, Date> = {};
        if (startDate) dateFilter.$gte = new Date(String(startDate));
        if (endDate) dateFilter.$lte = new Date(String(endDate));
        filter.lastActivityAt = dateFilter;
      }

      const sessions = await this.sessionModel
        .find(filter)
        .sort({ lastActivityAt: -1 })
        .limit(200)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  };

  public bulkDeleteSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { ids } = req.body;

      if (!Array.isArray(ids) || !ids.length) {
        throw new BadRequestError('Please provide an array of session IDs.');
      }

      const filter: Record<string, unknown> = { _id: { $in: ids } };
      if (user.organizationId && !user.roles.includes('superadmin')) {
        filter.organizationId = user.organizationId;
      }

      const result = await this.sessionModel.deleteMany(filter).exec();

      res.status(200).json({
        status: 'success',
        message: `${result.deletedCount} sessions deleted permanently.`,
        data: { deletedCount: result.deletedCount },
      });
    } catch (err) {
      next(err);
    }
  };

  public revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const sessionId = req.params.id;

      const session = await this.sessionModel.findById(sessionId).exec();
      if (!session) throw new NotFoundError('Session not found.');

      if (session.organizationId && session.organizationId !== user.organizationId && !user.roles.includes('superadmin')) {
        throw new ForbiddenError('Not permitted to revoke session outside your organization.');
      }

      const isOwner = session.userId === user.id;
      const isAdmin = user.roles.includes('superadmin') || user.permissions.includes('user:manage');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('Not permitted to revoke this session.');
      }

      session.isValid = false;
      session.terminatedAt = new Date();
      await session.save();

      res.status(200).json({
        status: 'success',
        message: 'Session revoked.',
        data: { sessionId },
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const sessionId = req.params.id;

      const filter: Record<string, unknown> = { _id: sessionId };
      if (user.organizationId && !user.roles.includes('superadmin')) {
        filter.organizationId = user.organizationId;
      }

      const session = await this.sessionModel.findOneAndDelete(filter).exec();
      if (!session) throw new NotFoundError('Session not found.');

      res.status(200).json({
        status: 'success',
        message: 'Session permanently deleted.',
        data: { sessionId },
      });
    } catch (err) {
      next(err);
    }
  };

  public revokeAllOthers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const currentToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

      const filter: Record<string, unknown> = {
        userId: user.id,
        isValid: true,
      };

      const result = await this.sessionModel.updateMany(
        filter,
        { $set: { isValid: false, terminatedAt: new Date() } }
      ).exec();

      res.status(200).json({
        status: 'success',
        message: 'All other sessions have been revoked.',
        data: { revokedCount: result.modifiedCount },
      });
    } catch (err) {
      next(err);
    }
  };
}

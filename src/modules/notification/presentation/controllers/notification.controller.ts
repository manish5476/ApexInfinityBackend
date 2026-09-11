import { Request, Response, NextFunction } from 'express';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
import { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/MarkNotificationReadUseCase';
import { GetNotificationStatsUseCase } from '../../application/use-cases/GetNotificationStatsUseCase';
import { GetUnreadCountUseCase } from '../../application/use-cases/GetUnreadCountUseCase';
import { DeleteNotificationUseCase } from '../../application/use-cases/DeleteNotificationUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { ApiResponseFactory } from '../../../../shared/contracts';

export class NotificationController {
  constructor(
    private readonly sendNotification: SendNotificationUseCase,
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly getStatsUseCase: GetNotificationStatsUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase
  ) {}

  public sendNotificationHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.sendNotification.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json(ApiResponseFactory.success(result.props));
    } catch (err) {
      next(err);
    }
  };

  public getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string, 10), 100) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';
      const isRead = unreadOnly ? false : req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const type = req.query.type as string | undefined;
      const businessType = req.query.businessType as string | undefined;

      const result = await this.listNotifications.execute(
        { page, limit, isRead, type, businessType, recipientId: ctx.userId },
        { organizationId: ctx.organizationId!, userId: ctx.userId }
      );

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
        unreadCount: result.unreadCount,
        data: { notifications: result.data.map((n) => n.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public getNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.listNotifications.execute(
        { page: 1, limit: 1 },
        { organizationId: ctx.organizationId!, userId: ctx.userId }
      );
      const notification = result.data.find((n) => n.id === req.params.id);
      if (!notification) {
        res.status(404).json({ status: 'fail', message: 'Notification not found' });
        return;
      }
      res.status(200).json(ApiResponseFactory.success({ notification: notification.props }));
    } catch (err) {
      next(err);
    }
  };

  public getUnreadCount = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const count = await this.getUnreadCountUseCase.execute({
        organizationId: ctx.organizationId!,
        recipientId: ctx.userId!,
      });
      res.status(200).json(ApiResponseFactory.success({ count }));
    } catch (err) {
      next(err);
    }
  };

  public getNotificationStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const stats = await this.getStatsUseCase.execute({
        organizationId: ctx.organizationId!,
        recipientId: ctx.userId!,
      });
      res.status(200).json(ApiResponseFactory.success({ stats }));
    } catch (err) {
      next(err);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.markRead.execute(
        { notificationId: req.params.id as string },
        { organizationId: ctx.organizationId!, recipientId: ctx.userId }
      );
      res.status(200).json(ApiResponseFactory.success({ notification: result.props }));
    } catch (err) {
      next(err);
    }
  };

  public markMultipleAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const notificationIds = req.body.notificationIds || [];
      const modifiedCount = await this.markRead.executeMultiple(
        { notificationIds },
        { organizationId: ctx.organizationId!, recipientId: ctx.userId! }
      );
      res.status(200).json({
        status: 'success',
        message: `${modifiedCount} notification(s) marked as read`,
        data: { modifiedCount },
      });
    } catch (err) {
      next(err);
    }
  };

  public markAllRead = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const modifiedCount = await this.markRead.executeAll({
        organizationId: ctx.organizationId!,
        recipientId: ctx.userId!,
      });
      res.status(200).json({
        status: 'success',
        message: `${modifiedCount} notification(s) marked as read`,
        data: { modifiedCount },
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await this.deleteNotificationUseCase.executeDeleteOne({
        id: req.params.id as string,
        organizationId: ctx.organizationId!,
        recipientId: ctx.userId,
      });
      res.status(200).json({ status: 'success', message: 'Notification deleted.' });
    } catch (err) {
      next(err);
    }
  };

  public clearAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const deletedCount = await this.deleteNotificationUseCase.executeClearAll({
        organizationId: ctx.organizationId!,
        recipientId: ctx.userId!,
      });
      res.status(200).json({
        status: 'success',
        message: `${deletedCount} notification(s) cleared.`,
        data: { deletedCount },
      });
    } catch (err) {
      next(err);
    }
  };
}

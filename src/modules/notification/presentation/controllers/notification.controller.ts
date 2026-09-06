import { Request, Response, NextFunction } from 'express';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
import { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/MarkNotificationReadUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class NotificationController {
  constructor(
    private readonly sendNotification: SendNotificationUseCase,
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase
  ) {}

  public sendNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.sendNotification.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public listNotificationsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const recipientId = (req.query.recipientId as string) || undefined;

      const result = await this.listNotifications.execute(
        { page, limit, isRead, recipientId },
        { organizationId: ctx.organizationId!, userId: ctx.userId }
      );

      res.status(200).json({
        status: 'success',
        data: result.data.map((n) => n.props),
        total: result.total,
        unreadCount: result.unreadCount,
      });
    } catch (err) {
      next(err);
    }
  };

  public markReadHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.markRead.execute(
        { notificationId: req.params.id as string },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };
}

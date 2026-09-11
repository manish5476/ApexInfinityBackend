import { Request, Response, NextFunction } from 'express';
import { AnnouncementUseCases } from '../../application/use-cases/AnnouncementUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { ApiResponseFactory } from '../../../../shared/contracts';

export class AnnouncementController {
  constructor(private readonly announcementUseCases: AnnouncementUseCases) {}

  public getAnnouncementStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const stats = await this.announcementUseCases.getStats(ctx.organizationId!);
      res.status(200).json(ApiResponseFactory.success({ stats }));
    } catch (err) {
      next(err);
    }
  };

  public searchAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const term = (req.query.q as string) || (req.query.term as string) || '';
      const announcements = await this.announcementUseCases.search(ctx.organizationId!, term);
      res.status(200).json(ApiResponseFactory.success({ announcements: announcements.map((a) => a.props) }));
    } catch (err) {
      next(err);
    }
  };

  public getAllAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const type = req.query.type as string | undefined;
      const targetAudience = req.query.targetAudience as string | undefined;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.announcementUseCases.listAnnouncements(ctx.organizationId!, {
        page,
        limit,
        type,
        targetAudience,
        search,
        isActive,
        userId: ctx.userId,
      });

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
        data: { announcements: result.data.map((a) => ({ ...a.props, isRead: a.isRead })) },
      });
    } catch (err) {
      next(err);
    }
  };

  public createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const announcement = await this.announcementUseCases.createAnnouncement(
        ctx.organizationId!,
        ctx.userId!,
        req.body
      );
      res.status(201).json(ApiResponseFactory.success({ announcement: announcement.props }));
    } catch (err) {
      next(err);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await this.announcementUseCases.markAsRead(req.params.id as string, ctx.userId!);
      res.status(200).json({ status: 'success', message: 'Announcement marked as read.' });
    } catch (err) {
      next(err);
    }
  };

  public updateAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const updated = await this.announcementUseCases.updateAnnouncement(
        ctx.organizationId!,
        req.params.id as string,
        req.body
      );
      res.status(200).json(ApiResponseFactory.success({ announcement: updated.props }));
    } catch (err) {
      next(err);
    }
  };

  public deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await this.announcementUseCases.deleteAnnouncement(ctx.organizationId!, req.params.id as string);
      res.status(200).json({ status: 'success', message: 'Announcement deleted.' });
    } catch (err) {
      next(err);
    }
  };
}

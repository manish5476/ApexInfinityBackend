import { Request, Response, NextFunction } from 'express';
import { RegisterWebhookUseCase } from '../../application/use-cases/RegisterWebhookUseCase';
import { ListWebhooksUseCase } from '../../application/use-cases/ListWebhooksUseCase';
import { GetWebhookByIdUseCase } from '../../application/use-cases/GetWebhookByIdUseCase';
import { UpdateWebhookUseCase } from '../../application/use-cases/UpdateWebhookUseCase';
import { DeleteWebhookUseCase } from '../../application/use-cases/DeleteWebhookUseCase';
import { TestWebhookUseCase } from '../../application/use-cases/TestWebhookUseCase';
import { TriggerWebhookDeliveriesUseCase } from '../../application/use-cases/TriggerWebhookDeliveriesUseCase';
import { ListWebhookDeliveriesUseCase } from '../../application/use-cases/ListWebhookDeliveriesUseCase';
import { GetWebhookStatsUseCase } from '../../application/use-cases/GetWebhookStatsUseCase';
import { ReplayWebhookDeliveryUseCase } from '../../application/use-cases/ReplayWebhookDeliveryUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class WebhookController {
  constructor(
    private readonly registerWebhook: RegisterWebhookUseCase,
    private readonly listWebhooks: ListWebhooksUseCase,
    private readonly getWebhookById: GetWebhookByIdUseCase,
    private readonly updateWebhook: UpdateWebhookUseCase,
    private readonly deleteWebhook: DeleteWebhookUseCase,
    private readonly testWebhook: TestWebhookUseCase,
    private readonly triggerWebhook: TriggerWebhookDeliveriesUseCase,
    private readonly listDeliveries: ListWebhookDeliveriesUseCase,
    private readonly getStats: GetWebhookStatsUseCase,
    private readonly replayDelivery: ReplayWebhookDeliveryUseCase
  ) {}

  public registerWebhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.registerWebhook.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public listWebhooksHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.listWebhooks.execute({ page, limit, isActive }, { organizationId: ctx.organizationId! });

      res.status(200).json({
        status: 'success',
        data: result.data.map((w) => w.props),
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  };

  public getWebhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getWebhookById.execute({ id: req.params.id as string, organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public updateWebhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.updateWebhook.execute({
        id: req.params.id as string,
        organizationId: ctx.organizationId!,
        ...req.body,
      });
      res.status(200).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public deleteWebhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await this.deleteWebhook.execute({ id: req.params.id as string, organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', message: 'Webhook deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  public testWebhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.testWebhook.execute({ id: req.params.id as string, organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  public testTriggerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { eventName, payload } = req.body;
      const result = await this.triggerWebhook.execute({
        organizationId: ctx.organizationId!,
        eventName,
        payload: payload || {},
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  public listDeliveriesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const webhookId = req.query.webhookId as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await this.listDeliveries.execute({
        organizationId: ctx.organizationId!,
        webhookId,
        status,
        page,
        limit,
      });
      res.status(200).json({
        status: 'success',
        data: result.data.map((d) => d.props),
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  };

  public getWebhookStatsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const sinceDays = req.query.sinceDays ? parseInt(req.query.sinceDays as string, 10) : undefined;
      const stats = await this.getStats.execute({ organizationId: ctx.organizationId!, sinceDays });
      res.status(200).json({ status: 'success', data: stats });
    } catch (err) {
      next(err);
    }
  };

  public replayDeliveryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.replayDelivery.execute({
        deliveryId: req.params.deliveryId as string,
        organizationId: ctx.organizationId!,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };
}

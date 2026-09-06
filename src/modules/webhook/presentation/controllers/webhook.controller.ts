import { Request, Response, NextFunction } from 'express';
import { RegisterWebhookUseCase } from '../../application/use-cases/RegisterWebhookUseCase';
import { ListWebhooksUseCase } from '../../application/use-cases/ListWebhooksUseCase';
import { TriggerWebhookDeliveriesUseCase } from '../../application/use-cases/TriggerWebhookDeliveriesUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class WebhookController {
  constructor(
    private readonly registerWebhook: RegisterWebhookUseCase,
    private readonly listWebhooks: ListWebhooksUseCase,
    private readonly triggerWebhook: TriggerWebhookDeliveriesUseCase
  ) {}

  public registerWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.registerWebhook.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public listWebhooksHandler = async (req: Request, res: Response, next: NextFunction) => {
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

  public testTriggerHandler = async (req: Request, res: Response, next: NextFunction) => {
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
}

import { Request, Response, NextFunction } from 'express';
import { ShipmentUseCases } from '../../application/use-cases/ShipmentUseCases';
import { createShipmentSchema, transitionShipmentSchema } from '../validation/shipment.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { ShipmentStatus } from '../../domain/entities/Shipment';

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

function param(req: Request, name: string): string {
  return (req.params[name] as string) || '';
}

export class ShipmentController {
  constructor(private readonly useCases: ShipmentUseCases) {}

  createShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId, user } = getContext(req);
      const body = createShipmentSchema.parse(req.body);

      const shipment = await this.useCases.createShipment({
        ...body,
        organizationId,
        actor: {
          id: userId,
          name: user?.name,
          email: user?.email,
        },
      });

      res.status(201).json({
        status: 'success',
        data: shipment.toPersistence(),
      });
    } catch (err) {
      next(err);
    }
  };

  listShipments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const query = req.query;

      const result = await this.useCases.listShipments(organizationId, {
        page: query.page ? parseInt(query.page as string, 10) : 1,
        limit: query.limit ? parseInt(query.limit as string, 10) : 50,
        status: query.status as ShipmentStatus | undefined,
        fulfillmentMode: query.fulfillmentMode as string | undefined,
        storeId: query.storeId as string | undefined,
        search: query.search as string | undefined,
        sortBy: query.sortBy as string | undefined,
        sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      });

      res.status(200).json({
        status: 'success',
        data: {
          items: result.items.map(s => s.toPersistence()),
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const shipmentId = param(req, 'shipmentId');

      const detail = await this.useCases.getShipmentDetail(organizationId, shipmentId);

      res.status(200).json({
        status: 'success',
        data: {
          shipment: detail.shipment.toPersistence(),
          activity: detail.activity,
          events: detail.events,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  transitionShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId, user } = getContext(req);
      const shipmentId = param(req, 'shipmentId');
      const body = transitionShipmentSchema.parse(req.body);

      const shipment = await this.useCases.transitionShipment(organizationId, shipmentId, {
        ...body,
        actor: {
          id: userId,
          name: user?.name,
          email: user?.email,
        },
      });

      res.status(200).json({
        status: 'success',
        data: shipment.toPersistence(),
      });
    } catch (err) {
      next(err);
    }
  };

  getOperationsSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const summary = await this.useCases.getOperationsSummary(organizationId);

      res.status(200).json({
        status: 'success',
        data: {
          byStatus: summary.byStatus,
          slaRisk: summary.slaRisk,
          recent: summary.recent.map(s => s.toPersistence()),
          generatedAt: summary.generatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

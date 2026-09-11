import { Request, Response, NextFunction } from 'express';
import { MasterListUseCases } from '../../application/use-cases/MasterListUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class MasterListController {
  constructor(private readonly useCases: MasterListUseCases) {}

  public getMasterList = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const data = await this.useCases.getMasterListSnapshot(ctx.organizationId!);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getSpecificList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const type = (req.query.type || req.query.entity) as string;
      const data = await this.useCases.getSpecificList(ctx.organizationId!, type, req.query as Record<string, unknown>);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  public getFilterOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const type = (req.query.type || req.query.entity) as string;
      const data = await this.useCases.getFilterOptions(ctx.organizationId!, type);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getQuickStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const period = req.query.period as string | undefined;
      const data = await this.useCases.getQuickStats(ctx.organizationId!, period);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  public getEntityDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { type, id } = req.params;
      const data = await this.useCases.getEntityDetails(ctx.organizationId!, type as string, id as string);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public getPermissionsMetadata = async (_req: Request, res: Response): Promise<void> => {
    const permissions = this.useCases.getPermissionsMetadata();
    res.status(200).json({
      status: 'success',
      results: permissions.length,
      data: permissions,
    });
  };

  public exportMasterList = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const data = await this.useCases.getMasterListSnapshot(ctx.organizationId!);
      res.setHeader('Content-Disposition', `attachment; filename="master-list-export-${Date.now()}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      next(err);
    }
  };

  public exportFilteredData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const type = (req.query.type || req.query.entity) as string;
      const data = await this.useCases.getSpecificList(ctx.organizationId!, type, req.query as Record<string, unknown>);
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      next(err);
    }
  };
}

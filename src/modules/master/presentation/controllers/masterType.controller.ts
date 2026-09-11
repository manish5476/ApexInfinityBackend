import { Request, Response, NextFunction } from 'express';
import { MasterTypeUseCases } from '../../application/use-cases/MasterTypeUseCases';

export class MasterTypeController {
  constructor(private readonly useCases: MasterTypeUseCases) {}

  public createMasterType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.useCases.createType(req.body);
      res.status(201).json({
        status: 'success',
        data: { masterType: result.props },
      });
    } catch (err) {
      next(err);
    }
  };

  public getMasterTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.useCases.getTypes({ isActive: true });
      res.status(200).json({
        status: 'success',
        results: result.length,
        data: { masterTypes: result.map((t) => t.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public updateMasterType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.useCases.updateType(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        data: { masterType: result.props },
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteMasterType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.deleteType(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Master type deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}

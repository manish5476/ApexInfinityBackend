import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class HolidayController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.createHoliday(context.organizationId, {
        ...req.body,
        date: new Date(req.body.date),
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listHolidays(context.organizationId, {
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        holidayType: req.query.holidayType as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.getHolidayById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.updateHoliday(context.organizationId, req.params.id!, {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.attendanceUseCases.deleteHoliday(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public getUpcoming = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getUpcomingHolidays(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const year = parseInt(req.params.year!, 10);
      const list = await this.attendanceUseCases.getHolidaysByYear(context.organizationId, year);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public checkDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.checkHolidayDate(context.organizationId, new Date(req.body.date));
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const stats = await this.attendanceUseCases.getHolidayStats(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(stats));
    } catch (err) {
      next(err);
    }
  };

  public exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const list = await this.attendanceUseCases.exportHolidays(context.organizationId, year);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const holidays = Array.isArray(req.body) ? req.body : req.body.holidays || [];
      const result = await this.attendanceUseCases.bulkCreateHolidays(context.organizationId, holidays);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public copyYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.copyYearHolidays(
        context.organizationId,
        parseInt(req.body.fromYear, 10),
        parseInt(req.body.toYear, 10)
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}

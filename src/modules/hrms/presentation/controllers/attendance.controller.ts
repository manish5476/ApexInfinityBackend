import { Request, Response, NextFunction } from 'express';
import { ProcessAttendancePunchUseCase } from '../../application/use-cases/ProcessAttendancePunchUseCase';
import { recordPunchSchema } from '../validators/attendance.validator';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class AttendanceController {
  private readonly punchUseCase: ProcessAttendancePunchUseCase;

  constructor(punchUseCase: ProcessAttendancePunchUseCase) {
    this.punchUseCase = punchUseCase;
  }

  public recordPunch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = recordPunchSchema.parse(req.body);
      const context = RequestContextHolder.get();

      const result = await this.punchUseCase.execute(validated, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };
}

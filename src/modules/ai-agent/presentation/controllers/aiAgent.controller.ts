import { Request, Response, NextFunction } from 'express';
import { AiAgentUseCases } from '../../application/use-cases/AiAgentUseCases';
import { aiMessageSchema } from '../validation/aiAgent.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getContext(req: Request): { organizationId: string; userId: string; branchId?: string } {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  const organizationId = ctx?.organizationId || user?.organizationId || '';
  const userId = ctx?.userId || user?._id || user?.id || 'system';
  const branchId = user?.branchId;
  return { organizationId, userId, branchId };
}

export class AiAgentController {
  constructor(private readonly useCases: AiAgentUseCases) {}

  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId, branchId } = getContext(req);
      const { message } = aiMessageSchema.parse(req.body);

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Your user account is not associated with an organization.',
        });
        return;
      }

      const result = await this.useCases.processUserMessage(message, {
        organizationId,
        branchId,
        userId,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };
}

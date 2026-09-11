import { Request, Response, NextFunction } from 'express';
import {
  WorkAssignmentUseCases,
  CreateSeriesResult,
} from '../../application/use-cases/WorkAssignmentUseCases';
import {
  createWorkAssignmentSchema,
  updateWorkAssignmentSchema,
  updateStatusSchema,
  completeWorkAssignmentSchema,
} from '../validation/workAssignment.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getContext(req: Request): { organizationId: string; userId: string } {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Express req.user
  const user = (req as any).user;
  const organizationId =
    ctx?.organizationId ||
    user?.organizationId ||
    (req.headers['x-organization-id'] as string) ||
    '';
  const userId = ctx?.userId || user?._id || user?.id || 'system';
  return { organizationId, userId };
}

function param(req: Request, name: string): string {
  return (req.params[name] as string) || '';
}

function parseIntQuery(req: Request, key: string, fallback: number): number {
  const v = req.query[key];
  return v ? parseInt(v as string, 10) : fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────────────────────────────────────

export class WorkAssignmentController {
  constructor(private readonly useCases: WorkAssignmentUseCases) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  createWorkAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const payload = createWorkAssignmentSchema.parse(req.body);
      const result = await this.useCases.create({ ...payload, organizationId, createdBy: userId });

      // Type guard: CreateSeriesResult has a 'count' property; WorkAssignment does not
      const isSeries = (r: typeof result): r is CreateSeriesResult => 'count' in r;

      if (isSeries(result)) {
        res.status(201).json({
          status: 'success',
          data: {
            seriesId: result.seriesId,
            count:    result.count,
            first:    result.first.toPersistence(),
          },
        });
      } else {
        res.status(201).json({
          status: 'success',
          data: { assignment: result.toPersistence() },
        });
      }
    } catch (err) {
      next(err);
    }
  };

  getAllWorkAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const result = await this.useCases.getList(organizationId, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query string values
        status:     req.query.status as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        priority:   req.query.priority as any,
        assignedTo: req.query.assignedTo as string | undefined,
        customerId: req.query.customerId as string | undefined,
        branchId:   req.query.branchId as string | undefined,
        search:     req.query.search as string | undefined,
        page:       parseIntQuery(req, 'page', 1),
        limit:      parseIntQuery(req, 'limit', 20),
        sortBy:     req.query.sortBy as string | undefined,
        sortOrder:  req.query.sortOrder === 'asc' ? 'asc' : 'desc',
      });
      res.status(200).json({
        status: 'success',
        data:   result.data.map(a => a.toPersistence()),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  getWorkAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const assignment = await this.useCases.getById(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', data: { assignment: assignment.toPersistence() } });
    } catch (err) {
      next(err);
    }
  };

  updateWorkAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const payload = updateWorkAssignmentSchema.parse(req.body);
      const assignment = await this.useCases.update(
        organizationId,
        param(req, 'id'),
        payload,
        userId,
      );
      res.status(200).json({ status: 'success', data: { assignment: assignment.toPersistence() } });
    } catch (err) {
      next(err);
    }
  };

  // ── Status transition ──────────────────────────────────────────────────────

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const { status } = updateStatusSchema.parse(req.body);
      const assignment = await this.useCases.updateStatus(
        organizationId,
        param(req, 'id'),
        status,
        userId,
      );

      const responseBody: Record<string, unknown> = {
        status: 'success',
        data: { assignment: assignment.toPersistence() },
      };

      // Surface SLA breach in the response so clients can notify users
      if (assignment.sla.breached) {
        responseBody['slaBreachDetected'] = true;
      }

      res.status(200).json(responseBody);
    } catch (err) {
      next(err);
    }
  };

  // ── Completion ─────────────────────────────────────────────────────────────

  completeWorkAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const completionData = completeWorkAssignmentSchema.parse(req.body);
      const assignment = await this.useCases.complete(
        organizationId,
        param(req, 'id'),
        completionData,
        userId,
      );
      res.status(200).json({ status: 'success', data: { assignment: assignment.toPersistence() } });
    } catch (err) {
      next(err);
    }
  };

  // ── Series ─────────────────────────────────────────────────────────────────

  getSeries = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const assignments = await this.useCases.getSeries(organizationId, param(req, 'seriesId'));
      res.status(200).json({
        status: 'success',
        results: assignments.length,
        data: { assignments: assignments.map(a => a.toPersistence()) },
      });
    } catch (err) {
      next(err);
    }
  };

  // ── Calendar ───────────────────────────────────────────────────────────────

  getCalendarRange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const { startDate, endDate, assignedTo, priority } = req.query as Record<string, string>;

      if (!startDate || !endDate) {
        res.status(400).json({
          status: 'fail',
          message: 'startDate and endDate query params are required',
        });
        return;
      }

      const assignments = await this.useCases.getCalendarRange(
        organizationId,
        startDate,
        endDate,
        {
          assignedTo,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query string cast
          priority: priority as any,
        },
      );

      res.status(200).json({
        status: 'success',
        results: assignments.length,
        data: { assignments: assignments.map(a => a.toPersistence()) },
      });
    } catch (err) {
      next(err);
    }
  };

  // ── Analytics & SLA ────────────────────────────────────────────────────────

  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const stats = await this.useCases.getStats(organizationId);
      res.status(200).json({ status: 'success', data: { stats } });
    } catch (err) {
      next(err);
    }
  };

  getSlaAtRisk = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const assignments = await this.useCases.getSlaAtRisk(organizationId);
      res.status(200).json({
        status: 'success',
        results: assignments.length,
        data: { assignments: assignments.map(a => a.toPersistence()) },
      });
    } catch (err) {
      next(err);
    }
  };
}

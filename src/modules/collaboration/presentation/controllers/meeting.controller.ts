import { Request, Response, NextFunction } from 'express';
import { MeetingUseCases } from '../../application/use-cases/MeetingUseCases';
import { NoteUseCases } from '../../application/use-cases/NoteUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getContext(req: Request): { organizationId: string; userId: string } {
  const ctx = RequestContextHolder.get();
  const organizationId = ctx?.organizationId || (req as any).user?.organizationId || (req.headers['x-organization-id'] as string) || '';
  const userId = ctx?.userId || (req as any).user?._id || (req as any).user?.id || 'system';
  return { organizationId, userId };
}

function param(req: Request, name: string): string {
  return (req.params[name] as string) || '';
}

export class MeetingController {
  constructor(
    private readonly meetingUseCases: MeetingUseCases,
    private readonly noteUseCases: NoteUseCases
  ) {}

  public createMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const meeting = await this.meetingUseCases.createMeeting(organizationId, userId, req.body);
      res.status(201).json({ status: 'success', data: { meeting: meeting.props } });
    } catch (err) {
      next(err);
    }
  };

  public getUserMeetings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.meetingUseCases.getMeetings(organizationId, {
        userId: req.query.all === 'true' ? undefined : userId,
        status: req.query.status as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page,
        limit,
      });

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
        data: { meetings: result.data.map((m) => m.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public getMeetingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const meeting = await this.meetingUseCases.getMeetingById(organizationId, param(req, 'meetingId'));
      res.status(200).json({ status: 'success', data: { meeting: meeting.props } });
    } catch (err) {
      next(err);
    }
  };

  public updateMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const meeting = await this.meetingUseCases.updateMeeting(organizationId, param(req, 'meetingId'), req.body);
      res.status(200).json({ status: 'success', data: { meeting: meeting.props } });
    } catch (err) {
      next(err);
    }
  };

  public cancelMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.meetingUseCases.cancelMeeting(organizationId, param(req, 'meetingId'));
      res.status(200).json({ status: 'success', message: 'Meeting cancelled' });
    } catch (err) {
      next(err);
    }
  };

  public meetingRSVP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const meeting = await this.meetingUseCases.respondRSVP(
        organizationId,
        param(req, 'meetingId'),
        userId,
        req.body.status,
        req.body.note
      );
      res.status(200).json({ status: 'success', data: { participants: meeting.participants } });
    } catch (err) {
      next(err);
    }
  };

  public joinMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const meeting = await this.meetingUseCases.joinMeeting(organizationId, param(req, 'meetingId'), userId);
      res.status(200).json({ status: 'success', data: { meeting: meeting.props } });
    } catch (err) {
      next(err);
    }
  };

  public leaveMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const meeting = await this.meetingUseCases.leaveMeeting(organizationId, param(req, 'meetingId'), userId);
      res.status(200).json({ status: 'success', data: { meeting: meeting.props } });
    } catch (err) {
      next(err);
    }
  };

  public addParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const participants = Array.isArray(req.body.participants)
        ? req.body.participants
        : [req.body];
      const meeting = await this.meetingUseCases.addParticipants(organizationId, param(req, 'meetingId'), participants);
      res.status(200).json({ status: 'success', data: { participants: meeting.participants } });
    } catch (err) {
      next(err);
    }
  };

  public removeParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const meeting = await this.meetingUseCases.removeParticipant(
        organizationId,
        param(req, 'meetingId'),
        param(req, 'userId')
      );
      res.status(200).json({ status: 'success', data: { participants: meeting.participants } });
    } catch (err) {
      next(err);
    }
  };

  public addActionItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const meeting = await this.meetingUseCases.addActionItem(organizationId, param(req, 'meetingId'), req.body);
      res.status(200).json({ status: 'success', data: { actionItems: meeting.actionItems } });
    } catch (err) {
      next(err);
    }
  };

  public convertActionItemToTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const result = await this.meetingUseCases.convertActionItemToTask(
        organizationId,
        param(req, 'meetingId'),
        param(req, 'actionItemId'),
        userId,
        this.noteUseCases
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  public createPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const meeting = await this.meetingUseCases.createPoll(organizationId, param(req, 'meetingId'), req.body);
      res.status(201).json({ status: 'success', data: { polls: meeting.polls } });
    } catch (err) {
      next(err);
    }
  };

  public votePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const meeting = await this.meetingUseCases.votePoll(
        organizationId,
        param(req, 'meetingId'),
        param(req, 'pollId'),
        req.body.optionId,
        userId
      );
      res.status(200).json({ status: 'success', data: { polls: meeting.polls } });
    } catch (err) {
      next(err);
    }
  };

  public getMeetingAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const stats = await this.meetingUseCases.getMeetingAnalytics(organizationId, userId);
      res.status(200).json({ status: 'success', data: stats });
    } catch (err) {
      next(err);
    }
  };
}

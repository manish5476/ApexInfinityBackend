import { Request, Response, NextFunction } from 'express';
import { NoteUseCases } from '../../application/use-cases/NoteUseCases';
import { CollaborationAnalyticsUseCases } from '../../application/use-cases/CollaborationAnalyticsUseCases';
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

export class NoteController {
  constructor(
    private readonly noteUseCases: NoteUseCases,
    private readonly analyticsUseCases: CollaborationAnalyticsUseCases
  ) {}

  public createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const result = await this.noteUseCases.createNote(organizationId, userId, req.body);
      res.status(201).json({ status: 'success', data: { note: result.props } });
    } catch (err) {
      next(err);
    }
  };

  public getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.noteUseCases.getNotes(organizationId, {
        creatorId: req.query.all === 'true' ? undefined : userId,
        itemType: req.query.itemType as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        search: req.query.search as string | undefined,
        tag: req.query.tag as string | undefined,
        isTrash: req.query.isTrash !== undefined ? req.query.isTrash === 'true' : undefined,
        isArchived: req.query.isArchived !== undefined ? req.query.isArchived === 'true' : undefined,
        isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
        page,
        limit,
      });

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
        data: { notes: result.data.map((n) => n.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public getNoteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.getNoteById(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', data: { note: note.props } });
    } catch (err) {
      next(err);
    }
  };

  public updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.updateNote(organizationId, param(req, 'id'), req.body);
      res.status(200).json({ status: 'success', data: { note: note.props } });
    } catch (err) {
      next(err);
    }
  };

  public deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.noteUseCases.deleteNote(organizationId, param(req, 'id'), false);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  public hardDeleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.noteUseCases.deleteNote(organizationId, param(req, 'id'), true);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  public togglePinNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const isPinned = await this.noteUseCases.togglePinNote(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', data: { isPinned } });
    } catch (err) {
      next(err);
    }
  };

  public archiveNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.noteUseCases.archiveNote(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', message: 'Note archived' });
    } catch (err) {
      next(err);
    }
  };

  public restoreNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.noteUseCases.restoreNote(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', message: 'Note restored' });
    } catch (err) {
      next(err);
    }
  };

  public duplicateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const duplicate = await this.noteUseCases.duplicateNote(organizationId, userId, param(req, 'id'));
      res.status(201).json({ status: 'success', data: { note: duplicate.props } });
    } catch (err) {
      next(err);
    }
  };

  public convertToTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.convertToTask(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', data: { note: note.props } });
    } catch (err) {
      next(err);
    }
  };

  public addChecklistItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.addChecklistItem(organizationId, param(req, 'id'), req.body);
      res.status(200).json({ status: 'success', data: { checklists: note.checklists } });
    } catch (err) {
      next(err);
    }
  };

  public toggleSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const completed = await this.noteUseCases.toggleChecklistItem(
        organizationId,
        param(req, 'id'),
        param(req, 'subtaskId'),
        userId
      );
      res.status(200).json({ status: 'success', data: { completed } });
    } catch (err) {
      next(err);
    }
  };

  public removeSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.removeChecklistItem(organizationId, param(req, 'id'), param(req, 'subtaskId'));
      res.status(200).json({ status: 'success', data: { checklists: note.checklists } });
    } catch (err) {
      next(err);
    }
  };

  public logTime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const note = await this.noteUseCases.addTimeLog(organizationId, param(req, 'id'), userId, req.body);
      res.status(200).json({ status: 'success', data: { timeLogs: note.timeLogs } });
    } catch (err) {
      next(err);
    }
  };

  public assignUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const note = await this.noteUseCases.assignUsers(
        organizationId,
        param(req, 'id'),
        req.body.userIds || [req.body.userId],
        userId,
        req.body.role
      );
      res.status(200).json({ status: 'success', data: { assignees: note.assignees } });
    } catch (err) {
      next(err);
    }
  };

  public updateAssignmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const note = await this.noteUseCases.updateAssignmentStatus(
        organizationId,
        param(req, 'id'),
        userId,
        req.body.status,
        req.body.notes
      );
      res.status(200).json({ status: 'success', data: { assignees: note.assignees } });
    } catch (err) {
      next(err);
    }
  };

  public shareNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.shareNote(
        organizationId,
        param(req, 'id'),
        req.body.user || req.body.userId,
        req.body.role || 'view'
      );
      res.status(200).json({ status: 'success', data: { sharedWith: note.sharedWith } });
    } catch (err) {
      next(err);
    }
  };

  public updateSharePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return this.shareNote(req, res, next);
  };

  public removeUserFromSharedNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.removeSharedUser(organizationId, param(req, 'id'), param(req, 'userId'));
      res.status(200).json({ status: 'success', data: { sharedWith: note.sharedWith } });
    } catch (err) {
      next(err);
    }
  };

  public linkNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.linkNote(organizationId, param(req, 'id'), req.body.targetNoteId);
      res.status(200).json({ status: 'success', data: { linkedNotes: note.linkedNotes } });
    } catch (err) {
      next(err);
    }
  };

  public unlinkNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.unlinkNote(organizationId, param(req, 'id'), req.body.targetNoteId);
      res.status(200).json({ status: 'success', data: { linkedNotes: note.linkedNotes } });
    } catch (err) {
      next(err);
    }
  };

  public bulkUpdateNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const count = await this.noteUseCases.bulkUpdateNotes(organizationId, req.body.ids, req.body.updates);
      res.status(200).json({ status: 'success', modifiedCount: count });
    } catch (err) {
      next(err);
    }
  };

  public bulkDeleteNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const count = await this.noteUseCases.bulkDeleteNotes(organizationId, req.body.ids);
      res.status(200).json({ status: 'success', deletedCount: count });
    } catch (err) {
      next(err);
    }
  };

  public getTrash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const result = await this.noteUseCases.getTrash(organizationId, userId);
      res.status(200).json({ status: 'success', data: { notes: result.data.map((n) => n.props), total: result.total } });
    } catch (err) {
      next(err);
    }
  };

  public restoreFromTrash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.noteUseCases.restoreFromTrash(organizationId, param(req, 'id'));
      res.status(200).json({ status: 'success', message: 'Note restored from trash' });
    } catch (err) {
      next(err);
    }
  };

  public emptyTrash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const count = await this.noteUseCases.emptyTrash(organizationId, userId);
      res.status(200).json({ status: 'success', deletedCount: count });
    } catch (err) {
      next(err);
    }
  };

  // ── Comments ────────────────────────────────────────────────
  public getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.noteUseCases.getComments(param(req, 'id'));
      res.status(200).json({ status: 'success', data: { comments: comments.map((c) => c.props) } });
    } catch (err) {
      next(err);
    }
  };

  public addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const comment = await this.noteUseCases.addComment(
        organizationId,
        param(req, 'id'),
        userId,
        req.body.content,
        req.body.parentId
      );
      res.status(201).json({ status: 'success', data: { comment: comment.props } });
    } catch (err) {
      next(err);
    }
  };

  public deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.noteUseCases.deleteComment(param(req, 'commentId'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  public reactToComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = getContext(req);
      const comment = await this.noteUseCases.reactToComment(param(req, 'commentId'), req.body.emoji, userId);
      res.status(200).json({ status: 'success', data: { comment: comment.props } });
    } catch (err) {
      next(err);
    }
  };

  // ── Search & Analytics ──────────────────────────────────────
  public searchNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const search = (req.query.q as string) || (req.query.search as string);
      const result = await this.noteUseCases.getNotes(organizationId, {
        creatorId: userId,
        search,
        limit: 20,
      });
      res.status(200).json({ status: 'success', data: { notes: result.data.map((n) => n.props) } });
    } catch (err) {
      next(err);
    }
  };

  public getKnowledgeGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const graph = await this.analyticsUseCases.getKnowledgeGraph(organizationId, userId);
      res.status(200).json({ status: 'success', data: graph });
    } catch (err) {
      next(err);
    }
  };

  public getHeatMapData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const heatmap = await this.analyticsUseCases.getHeatmapData(organizationId, userId, year);
      res.status(200).json({ status: 'success', data: heatmap });
    } catch (err) {
      next(err);
    }
  };

  public getNoteAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const stats = await this.analyticsUseCases.getStatsSummary(organizationId, userId);
      res.status(200).json({ status: 'success', data: stats });
    } catch (err) {
      next(err);
    }
  };

  public getNoteStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return this.getNoteAnalytics(req, res, next);
  };

  public getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const activities = await this.analyticsUseCases.getRecentActivity(organizationId, userId);
      res.status(200).json({ status: 'success', data: activities });
    } catch (err) {
      next(err);
    }
  };

  public getCalendarView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const start = req.query.start ? new Date(req.query.start as string) : undefined;
      const end = req.query.end ? new Date(req.query.end as string) : undefined;
      const calendar = await this.analyticsUseCases.getCalendarView(organizationId, userId, start, end);
      res.status(200).json({ status: 'success', data: calendar });
    } catch (err) {
      next(err);
    }
  };

  public getNotesForMonth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const notes = await this.analyticsUseCases.getMonthlyNotes(organizationId, userId, year, month);
      res.status(200).json({ status: 'success', data: notes.map((n) => n.props) });
    } catch (err) {
      next(err);
    }
  };

  public exportNoteData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const data = await this.analyticsUseCases.exportData(organizationId, userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  public exportAllUserNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return this.exportNoteData(req, res, next);
  };

  public getSharedNotesWithMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const result = await this.noteUseCases.getNotes(organizationId, {
        sharedWithUser: userId,
      });
      res.status(200).json({ status: 'success', data: { notes: result.data.map((n) => n.props) } });
    } catch (err) {
      next(err);
    }
  };

  public getNotesSharedByMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const result = await this.noteUseCases.getNotes(organizationId, {
        creatorId: userId,
      });
      res.status(200).json({
        status: 'success',
        data: { notes: result.data.filter((n) => n.sharedWith.length > 0).map((n) => n.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public getAllOrganizationNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const result = await this.noteUseCases.getNotes(organizationId, {});
      res.status(200).json({ status: 'success', data: { notes: result.data.map((n) => n.props) } });
    } catch (err) {
      next(err);
    }
  };

  public getNoteHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const note = await this.noteUseCases.getNoteById(organizationId, param(req, 'id'));
      res.status(200).json({
        status: 'success',
        data: {
          history: [
            { action: 'created', timestamp: note.props.createdAt },
            { action: 'updated', timestamp: note.props.updatedAt },
          ],
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          files: (req.files as any[])?.map((f) => ({
            name: f.originalname,
            url: `/uploads/${f.filename || f.originalname}`,
            size: f.size,
          })) || [],
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

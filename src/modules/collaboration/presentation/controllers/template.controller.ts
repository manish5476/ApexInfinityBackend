import { Request, Response, NextFunction } from 'express';
import { NoteTemplateUseCases } from '../../application/use-cases/NoteTemplateUseCases';
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

export class TemplateController {
  constructor(
    private readonly templateUseCases: NoteTemplateUseCases,
    private readonly noteUseCases: NoteUseCases
  ) {}

  public createNoteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const template = await this.templateUseCases.createTemplate(organizationId, userId, req.body);
      res.status(201).json({ status: 'success', data: { template: template.props } });
    } catch (err) {
      next(err);
    }
  };

  public getNoteTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const templates = await this.templateUseCases.getTemplates(organizationId, req.query.itemType as string);
      res.status(200).json({ status: 'success', data: { templates: templates.map((t) => t.props) } });
    } catch (err) {
      next(err);
    }
  };

  public createFromTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const note = await this.templateUseCases.createFromTemplate(
        organizationId,
        userId,
        param(req, 'templateId'),
        this.noteUseCases,
        req.body
      );
      res.status(201).json({ status: 'success', data: { note: note.props } });
    } catch (err) {
      next(err);
    }
  };

  public updateNoteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const template = await this.templateUseCases.updateTemplate(
        organizationId,
        param(req, 'templateId'),
        req.body
      );
      res.status(200).json({ status: 'success', data: { template: template.props } });
    } catch (err) {
      next(err);
    }
  };

  public deleteNoteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.templateUseCases.deleteTemplate(organizationId, param(req, 'templateId'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

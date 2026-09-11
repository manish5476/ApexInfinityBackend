import { v4 as uuidv4 } from 'uuid';
import { INoteTemplateRepository } from '../../domain/ports/INoteTemplateRepository';
import { NoteTemplate, TemplateChecklistItem } from '../../domain/entities/NoteTemplate';
import { NoteItemType } from '../../domain/entities/Note';
import { NotFoundError, ValidationError } from '../../../../shared/errors';
import { NoteUseCases } from './NoteUseCases';

export class NoteTemplateUseCases {
  constructor(private readonly templateRepo: INoteTemplateRepository) {}

  async createTemplate(
    organizationId: string,
    createdBy: string,
    params: {
      name: string;
      description?: string | null;
      itemType?: NoteItemType;
      content?: string;
      checklists?: TemplateChecklistItem[];
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<NoteTemplate> {
    if (!params.name || !params.name.trim()) {
      throw new ValidationError('Template name is required');
    }

    const template = NoteTemplate.create({
      id: uuidv4(),
      organizationId,
      createdBy,
      ...params,
    });

    await this.templateRepo.save(template);
    return template;
  }

  async getTemplates(organizationId: string, itemType?: string): Promise<NoteTemplate[]> {
    return this.templateRepo.list({ organizationId, itemType });
  }

  async getTemplateById(organizationId: string, id: string): Promise<NoteTemplate> {
    const template = await this.templateRepo.findById({ id, organizationId });
    if (!template) throw new NotFoundError('NoteTemplate', id);
    return template;
  }

  async updateTemplate(
    organizationId: string,
    id: string,
    updates: Parameters<NoteTemplate['updateDetails']>[0]
  ): Promise<NoteTemplate> {
    const template = await this.getTemplateById(organizationId, id);
    template.updateDetails(updates);
    await this.templateRepo.save(template);
    return template;
  }

  async deleteTemplate(organizationId: string, id: string): Promise<void> {
    const deleted = await this.templateRepo.delete({ id, organizationId });
    if (!deleted) throw new NotFoundError('NoteTemplate', id);
  }

  async createFromTemplate(
    organizationId: string,
    creatorId: string,
    templateId: string,
    noteUseCases: NoteUseCases,
    overrides?: { title?: string; dueDate?: Date | null }
  ): Promise<any> {
    const template = await this.getTemplateById(organizationId, templateId);

    const note = await noteUseCases.createNote(organizationId, creatorId, {
      title: overrides?.title || template.name,
      content: template.content,
      itemType: template.itemType,
      tags: [...template.props.tags],
      dueDate: overrides?.dueDate || null,
    });

    // Add checklists from template
    for (const ch of template.checklists) {
      await noteUseCases.addChecklistItem(organizationId, note.id, {
        title: ch.title,
        order: ch.order,
      });
    }

    return noteUseCases.getNoteById(organizationId, note.id);
  }
}

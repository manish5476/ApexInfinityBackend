import { NoteTemplate } from '../entities/NoteTemplate';

export interface INoteTemplateRepository {
  save(template: NoteTemplate): Promise<void>;
  findById(query: { id: string; organizationId: string }): Promise<NoteTemplate | null>;
  delete(query: { id: string; organizationId: string }): Promise<boolean>;
  list(query: { organizationId: string; itemType?: string }): Promise<NoteTemplate[]>;
}

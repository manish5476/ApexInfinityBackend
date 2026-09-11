import { INoteTemplateRepository } from '../../domain/ports/INoteTemplateRepository';
import { NoteTemplate } from '../../domain/entities/NoteTemplate';

export class InMemoryNoteTemplateRepository implements INoteTemplateRepository {
  public items: NoteTemplate[] = [];

  async save(template: NoteTemplate): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === template.id);
    if (idx >= 0) {
      this.items[idx] = template;
    } else {
      this.items.push(template);
    }
  }

  async findById(query: { id: string; organizationId: string }): Promise<NoteTemplate | null> {
    const item = this.items.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return item ? NoteTemplate.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const idx = this.items.findIndex((x) => x.id === query.id && x.organizationId === query.organizationId);
    if (idx < 0) return false;
    this.items.splice(idx, 1);
    return true;
  }

  async list(query: { organizationId: string; itemType?: string }): Promise<NoteTemplate[]> {
    let filtered = this.items.filter((x) => x.organizationId === query.organizationId);
    if (query.itemType) {
      filtered = filtered.filter((x) => x.itemType === query.itemType);
    }
    return filtered.map((x) => NoteTemplate.reconstitute({ ...x.props, id: x.id }));
  }
}

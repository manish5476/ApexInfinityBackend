import { INoteTemplateRepository } from '../../domain/ports/INoteTemplateRepository';
import { NoteTemplate, NoteTemplateProps } from '../../domain/entities/NoteTemplate';
import { FwNoteTemplate, NoteTemplateDoc } from '../persistence/collaboration.model';

export class MongoNoteTemplateRepository implements INoteTemplateRepository {
  private toEntity(doc: any): NoteTemplate {
    return NoteTemplate.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      name: doc.name,
      description: doc.description || null,
      itemType: doc.itemType as any,
      content: doc.content,
      checklists: doc.checklists || [],
      tags: doc.tags || [],
      isPublic: doc.isPublic,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(template: NoteTemplate): Promise<void> {
    const props = template.props;
    await FwNoteTemplate.findOneAndUpdate(
      { _id: template.id, organizationId: props.organizationId },
      {
        $set: {
          name: props.name,
          description: props.description,
          itemType: props.itemType,
          content: props.content,
          checklists: props.checklists,
          tags: props.tags,
          isPublic: props.isPublic,
          createdBy: props.createdBy,
        },
      },
      { upsert: true }
    );
  }

  async findById(query: { id: string; organizationId: string }): Promise<NoteTemplate | null> {
    const doc = await FwNoteTemplate.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const res = await FwNoteTemplate.deleteOne({ _id: query.id, organizationId: query.organizationId });
    return res.deletedCount > 0;
  }

  async list(query: { organizationId: string; itemType?: string }): Promise<NoteTemplate[]> {
    const filter: Record<string, any> = { organizationId: query.organizationId };
    if (query.itemType) filter.itemType = query.itemType;

    const docs = await FwNoteTemplate.find(filter).sort({ name: 1 }).lean();
    return docs.map((d) => this.toEntity(d));
  }
}

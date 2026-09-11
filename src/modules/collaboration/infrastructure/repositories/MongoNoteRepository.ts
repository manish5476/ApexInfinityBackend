import { INoteRepository, NoteListQuery, GraphNetworkResult } from '../../domain/ports/INoteRepository';
import { Note, NoteProps } from '../../domain/entities/Note';
import { FwNote, NoteDoc } from '../persistence/collaboration.model';

export class MongoNoteRepository implements INoteRepository {
  private toEntity(doc: any): Note {
    return Note.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      creatorId: doc.creatorId,
      title: doc.title,
      content: doc.content,
      itemType: doc.itemType as any,
      status: doc.status as any,
      priority: doc.priority as any,
      visibility: doc.visibility as any,
      assignees: doc.assignees || [],
      checklists: doc.checklists || [],
      timeLogs: doc.timeLogs || [],
      tags: doc.tags || [],
      linkedNotes: doc.linkedNotes || [],
      attachments: doc.attachments || [],
      location: doc.location || null,
      sharedWith: doc.sharedWith || [],
      isPinned: doc.isPinned,
      isArchived: doc.isArchived,
      isTrash: doc.isTrash,
      trashedAt: doc.trashedAt || null,
      color: doc.color || null,
      startDate: doc.startDate || null,
      dueDate: doc.dueDate || null,
      completedAt: doc.completedAt || null,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(note: Note): Promise<void> {
    const props = note.props;
    await FwNote.findOneAndUpdate(
      { _id: note.id, organizationId: props.organizationId },
      {
        $set: {
          creatorId: props.creatorId,
          title: props.title,
          content: props.content,
          itemType: props.itemType,
          status: props.status,
          priority: props.priority,
          visibility: props.visibility,
          assignees: props.assignees,
          checklists: props.checklists,
          timeLogs: props.timeLogs,
          tags: props.tags,
          linkedNotes: props.linkedNotes,
          attachments: props.attachments,
          location: props.location,
          sharedWith: props.sharedWith,
          isPinned: props.isPinned,
          isArchived: props.isArchived,
          isTrash: props.isTrash,
          trashedAt: props.trashedAt,
          color: props.color,
          startDate: props.startDate,
          dueDate: props.dueDate,
          completedAt: props.completedAt,
          metadata: props.metadata,
        },
      },
      { upsert: true }
    );
  }

  async findById(query: { id: string; organizationId: string }): Promise<Note | null> {
    const doc = await FwNote.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(query: { id: string; organizationId: string; hardDelete?: boolean }): Promise<boolean> {
    if (query.hardDelete) {
      const res = await FwNote.deleteOne({ _id: query.id, organizationId: query.organizationId });
      return res.deletedCount > 0;
    }
    const res = await FwNote.findOneAndUpdate(
      { _id: query.id, organizationId: query.organizationId },
      { isTrash: true, trashedAt: new Date() }
    );
    return !!res;
  }

  async list(query: NoteListQuery): Promise<{ data: Note[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };

    if (query.creatorId) filter.creatorId = query.creatorId;
    if (query.itemType) filter.itemType = query.itemType;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.isTrash !== undefined) {
      filter.isTrash = query.isTrash;
    } else {
      filter.isTrash = false;
    }
    if (query.isArchived !== undefined) filter.isArchived = query.isArchived;
    if (query.isPinned !== undefined) filter.isPinned = query.isPinned;
    if (query.tag) filter.tags = query.tag;
    if (query.sharedWithUser) filter['sharedWith.user'] = query.sharedWithUser;
    if (query.assigneeUser) filter['assignees.user'] = query.assigneeUser;
    if (query.search) {
      const term = query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { content: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
      ];
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 500);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      FwNote.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      FwNote.countDocuments(filter),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
    };
  }

  async getKnowledgeGraph(organizationId: string, userId?: string): Promise<GraphNetworkResult> {
    const filter: Record<string, any> = { organizationId, isTrash: false };
    if (userId) filter.creatorId = userId;

    const docs = await FwNote.find(filter).select('_id title itemType status linkedNotes').lean();

    const nodes = docs.map((d: any) => ({
      id: d._id,
      title: d.title,
      type: d.itemType,
      status: d.status,
    }));

    const validIds = new Set(nodes.map((n) => n.id));
    const links: Array<{ source: string; target: string }> = [];

    for (const d of docs as any[]) {
      if (Array.isArray(d.linkedNotes)) {
        for (const linkedId of d.linkedNotes) {
          if (validIds.has(linkedId)) {
            links.push({ source: d._id, target: linkedId });
          }
        }
      }
    }

    return { nodes, links };
  }

  async getHeatmapData(organizationId: string, userId?: string, year?: number): Promise<Record<string, number>> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(Date.UTC(targetYear, 0, 1));
    const endDate = new Date(Date.UTC(targetYear + 1, 0, 1));

    const filter: Record<string, any> = {
      organizationId,
      createdAt: { $gte: startDate, $lt: endDate },
    };
    if (userId) filter.creatorId = userId;

    const results = await FwNote.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const heatmap: Record<string, number> = {};
    for (const r of results) {
      heatmap[r._id] = r.count;
    }
    return heatmap;
  }

  async getStatsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    const filter: Record<string, any> = { organizationId };
    if (userId) filter.creatorId = userId;

    const [totalItems, notes, tasks, completedTasks, openTasks, pinned, archived, inTrash] = await Promise.all([
      FwNote.countDocuments(filter),
      FwNote.countDocuments({ ...filter, itemType: 'note', isTrash: false }),
      FwNote.countDocuments({ ...filter, itemType: 'task', isTrash: false }),
      FwNote.countDocuments({ ...filter, itemType: 'task', status: { $in: ['done', 'completed'] }, isTrash: false }),
      FwNote.countDocuments({ ...filter, itemType: 'task', status: 'open', isTrash: false }),
      FwNote.countDocuments({ ...filter, isPinned: true, isTrash: false }),
      FwNote.countDocuments({ ...filter, isArchived: true, isTrash: false }),
      FwNote.countDocuments({ ...filter, isTrash: true }),
    ]);

    return {
      totalItems,
      notes,
      tasks,
      completedTasks,
      openTasks,
      pinned,
      archived,
      inTrash,
    };
  }

  async bulkUpdate(organizationId: string, ids: string[], updates: Partial<NoteProps>): Promise<number> {
    const res = await FwNote.updateMany(
      { _id: { $in: ids }, organizationId },
      { $set: updates }
    );
    return res.modifiedCount;
  }

  async bulkDelete(organizationId: string, ids: string[]): Promise<number> {
    const res = await FwNote.updateMany(
      { _id: { $in: ids }, organizationId },
      { $set: { isTrash: true, trashedAt: new Date() } }
    );
    return res.modifiedCount;
  }

  async emptyTrash(organizationId: string, userId?: string): Promise<number> {
    const filter: Record<string, any> = { organizationId, isTrash: true };
    if (userId) filter.creatorId = userId;

    const res = await FwNote.deleteMany(filter);
    return res.deletedCount;
  }
}

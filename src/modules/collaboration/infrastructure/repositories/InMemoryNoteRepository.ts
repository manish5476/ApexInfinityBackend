import { INoteRepository, NoteListQuery, GraphNetworkResult } from '../../domain/ports/INoteRepository';
import { Note, NoteProps } from '../../domain/entities/Note';

export class InMemoryNoteRepository implements INoteRepository {
  public items: Note[] = [];

  async save(note: Note): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === note.id);
    if (idx >= 0) {
      this.items[idx] = note;
    } else {
      this.items.push(note);
    }
  }

  async findById(query: { id: string; organizationId: string }): Promise<Note | null> {
    const item = this.items.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return item ? Note.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async delete(query: { id: string; organizationId: string; hardDelete?: boolean }): Promise<boolean> {
    const idx = this.items.findIndex((x) => x.id === query.id && x.organizationId === query.organizationId);
    if (idx < 0) return false;
    if (query.hardDelete) {
      this.items.splice(idx, 1);
    } else {
      const item = this.items[idx];
      if (item) {
        item.moveToTrash();
      }
    }
    return true;
  }

  async list(query: NoteListQuery): Promise<{ data: Note[]; total: number }> {
    let filtered = this.items.filter((x) => x.organizationId === query.organizationId);

    if (query.creatorId) {
      filtered = filtered.filter((x) => x.creatorId === query.creatorId);
    }
    if (query.itemType) {
      filtered = filtered.filter((x) => x.itemType === query.itemType);
    }
    if (query.status) {
      filtered = filtered.filter((x) => x.status === query.status);
    }
    if (query.priority) {
      filtered = filtered.filter((x) => x.priority === query.priority);
    }
    if (query.isTrash !== undefined) {
      filtered = filtered.filter((x) => x.isTrash === query.isTrash);
    } else {
      filtered = filtered.filter((x) => !x.isTrash);
    }
    if (query.isArchived !== undefined) {
      filtered = filtered.filter((x) => x.isArchived === query.isArchived);
    }
    if (query.isPinned !== undefined) {
      filtered = filtered.filter((x) => x.isPinned === query.isPinned);
    }
    if (query.tag) {
      filtered = filtered.filter((x) => x.tags.includes(query.tag!));
    }
    if (query.sharedWithUser) {
      filtered = filtered.filter((x) => x.sharedWith.some((s) => s.user === query.sharedWithUser));
    }
    if (query.assigneeUser) {
      filtered = filtered.filter((x) => x.assignees.some((a) => a.user === query.assigneeUser));
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (x) =>
          x.title.toLowerCase().includes(term) ||
          x.content.toLowerCase().includes(term) ||
          x.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    filtered.sort((a, b) => b.props.updatedAt.getTime() - a.props.updatedAt.getTime());

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((x) => Note.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }

  async getKnowledgeGraph(organizationId: string, userId?: string): Promise<GraphNetworkResult> {
    const userNotes = this.items.filter(
      (x) => x.organizationId === organizationId && !x.isTrash && (!userId || x.creatorId === userId)
    );

    const nodes = userNotes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.itemType,
      status: n.status,
    }));

    const links: Array<{ source: string; target: string }> = [];
    const validIds = new Set(nodes.map((n) => n.id));

    for (const n of userNotes) {
      for (const linkedId of n.linkedNotes) {
        if (validIds.has(linkedId)) {
          links.push({ source: n.id, target: linkedId });
        }
      }
    }

    return { nodes, links };
  }

  async getHeatmapData(organizationId: string, userId?: string, year?: number): Promise<Record<string, number>> {
    const targetYear = year || new Date().getFullYear();
    const heatmap: Record<string, number> = {};

    const notes = this.items.filter(
      (x) =>
        x.organizationId === organizationId &&
        (!userId || x.creatorId === userId) &&
        x.props.createdAt.getFullYear() === targetYear
    );

    for (const n of notes) {
      const dateStr = n.props.createdAt.toISOString().slice(0, 10);
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
    }

    return heatmap;
  }

  async getStatsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    const notes = this.items.filter((x) => x.organizationId === organizationId && (!userId || x.creatorId === userId));

    return {
      totalItems: notes.length,
      notes: notes.filter((x) => x.itemType === 'note' && !x.isTrash).length,
      tasks: notes.filter((x) => x.itemType === 'task' && !x.isTrash).length,
      completedTasks: notes.filter((x) => x.itemType === 'task' && (x.status === 'done' || x.status === 'completed') && !x.isTrash).length,
      openTasks: notes.filter((x) => x.itemType === 'task' && x.status === 'open' && !x.isTrash).length,
      pinned: notes.filter((x) => x.isPinned && !x.isTrash).length,
      archived: notes.filter((x) => x.isArchived && !x.isTrash).length,
      inTrash: notes.filter((x) => x.isTrash).length,
    };
  }

  async bulkUpdate(organizationId: string, ids: string[], updates: Partial<NoteProps>): Promise<number> {
    let count = 0;
    const idSet = new Set(ids);
    for (const item of this.items) {
      if (item.organizationId === organizationId && idSet.has(item.id)) {
        item.updateDetails(updates as any);
        count++;
      }
    }
    return count;
  }

  async bulkDelete(organizationId: string, ids: string[]): Promise<number> {
    let count = 0;
    const idSet = new Set(ids);
    for (const item of this.items) {
      if (item.organizationId === organizationId && idSet.has(item.id)) {
        item.moveToTrash();
        count++;
      }
    }
    return count;
  }

  async emptyTrash(organizationId: string, userId?: string): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter(
      (x) => !(x.organizationId === organizationId && x.isTrash && (!userId || x.creatorId === userId))
    );
    return before - this.items.length;
  }
}

import { v4 as uuidv4 } from 'uuid';
import { INoteRepository, NoteListQuery } from '../../domain/ports/INoteRepository';
import { INoteCommentRepository } from '../../domain/ports/INoteCommentRepository';
import { Note, NoteItemType, NotePriority, NoteStatus, NoteVisibility } from '../../domain/entities/Note';
import { NoteComment } from '../../domain/entities/NoteComment';
import { NotFoundError, ValidationError } from '../../../../shared/errors';

export class NoteUseCases {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly commentRepo: INoteCommentRepository
  ) {}

  async createNote(
    organizationId: string,
    creatorId: string,
    params: {
      title: string;
      content?: string;
      itemType?: NoteItemType;
      status?: NoteStatus;
      priority?: NotePriority;
      visibility?: NoteVisibility;
      tags?: string[];
      attachments?: Array<{ url: string; name: string; size?: number; mimeType?: string }>;
      color?: string | null;
      startDate?: Date | null;
      dueDate?: Date | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Note> {
    if (!params.title || !params.title.trim()) {
      throw new ValidationError('Title is required');
    }

    const note = Note.create({
      id: uuidv4(),
      organizationId,
      creatorId,
      ...params,
    });

    await this.noteRepo.save(note);
    return note;
  }

  async getNotes(organizationId: string, query: Omit<NoteListQuery, 'organizationId'>): Promise<{ data: Note[]; total: number }> {
    return this.noteRepo.list({ organizationId, ...query });
  }

  async getNoteById(organizationId: string, id: string): Promise<Note> {
    const note = await this.noteRepo.findById({ id, organizationId });
    if (!note) throw new NotFoundError('Note', id);
    return note;
  }

  async updateNote(
    organizationId: string,
    id: string,
    updates: Parameters<Note['updateDetails']>[0]
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, id);
    note.updateDetails(updates);
    await this.noteRepo.save(note);
    return note;
  }

  async deleteNote(organizationId: string, id: string, hardDelete = false): Promise<void> {
    const deleted = await this.noteRepo.delete({ id, organizationId, hardDelete });
    if (!deleted) throw new NotFoundError('Note', id);
  }

  async togglePinNote(organizationId: string, id: string): Promise<boolean> {
    const note = await this.getNoteById(organizationId, id);
    const pinned = note.togglePin();
    await this.noteRepo.save(note);
    return pinned;
  }

  async archiveNote(organizationId: string, id: string): Promise<void> {
    const note = await this.getNoteById(organizationId, id);
    note.archive();
    await this.noteRepo.save(note);
  }

  async restoreNote(organizationId: string, id: string): Promise<void> {
    const note = await this.getNoteById(organizationId, id);
    note.unarchive();
    await this.noteRepo.save(note);
  }

  async restoreFromTrash(organizationId: string, id: string): Promise<void> {
    const note = await this.getNoteById(organizationId, id);
    note.restoreFromTrash();
    await this.noteRepo.save(note);
  }

  async duplicateNote(organizationId: string, creatorId: string, id: string): Promise<Note> {
    const source = await this.getNoteById(organizationId, id);
    const duplicate = Note.create({
      id: uuidv4(),
      organizationId,
      creatorId,
      title: `${source.title} (Copy)`,
      content: source.content,
      itemType: source.itemType,
      priority: source.priority,
      tags: [...source.tags],
      metadata: { ...source.props.metadata },
    });
    await this.noteRepo.save(duplicate);
    return duplicate;
  }

  async convertToTask(organizationId: string, id: string): Promise<Note> {
    const note = await this.getNoteById(organizationId, id);
    note.convertToTask();
    await this.noteRepo.save(note);
    return note;
  }

  async addChecklistItem(
    organizationId: string,
    noteId: string,
    params: { title: string; assignedTo?: string | null; dueDate?: Date | null; order?: number }
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.addChecklistItem({
      id: uuidv4(),
      title: params.title,
      completed: false,
      assignedTo: params.assignedTo || null,
      dueDate: params.dueDate || null,
      order: params.order ?? note.checklists.length,
    });
    await this.noteRepo.save(note);
    return note;
  }

  async toggleChecklistItem(organizationId: string, noteId: string, itemId: string, userId?: string): Promise<boolean> {
    const note = await this.getNoteById(organizationId, noteId);
    const completed = note.toggleChecklistItem(itemId, userId);
    await this.noteRepo.save(note);
    return completed;
  }

  async removeChecklistItem(organizationId: string, noteId: string, itemId: string): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.removeChecklistItem(itemId);
    await this.noteRepo.save(note);
    return note;
  }

  async addTimeLog(
    organizationId: string,
    noteId: string,
    userId: string,
    params: { startTime: Date; endTime?: Date | null; hours?: number | null; note?: string | null }
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.addTimeLog({
      id: uuidv4(),
      user: userId,
      startTime: params.startTime,
      endTime: params.endTime || null,
      hours: params.hours || null,
      note: params.note || null,
    });
    await this.noteRepo.save(note);
    return note;
  }

  async assignUsers(
    organizationId: string,
    noteId: string,
    userIds: string[],
    assignedBy: string,
    role: 'owner' | 'collaborator' | 'reviewer' | 'observer' = 'collaborator'
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    const assignees = userIds.map((u) => ({
      id: uuidv4(),
      user: u,
      assignedBy,
      assignedAt: new Date(),
      role,
      status: 'pending' as const,
    }));
    note.assignUsers(assignees);
    await this.noteRepo.save(note);
    return note;
  }

  async updateAssignmentStatus(
    organizationId: string,
    noteId: string,
    userId: string,
    status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'done' | 'verified',
    notes?: string
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.updateAssignmentStatus(userId, status, notes);
    await this.noteRepo.save(note);
    return note;
  }

  async shareNote(
    organizationId: string,
    noteId: string,
    user: string,
    role: 'view' | 'edit' | 'admin'
  ): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.shareWithUser(user, role);
    await this.noteRepo.save(note);
    return note;
  }

  async removeSharedUser(organizationId: string, noteId: string, user: string): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    note.removeSharedUser(user);
    await this.noteRepo.save(note);
    return note;
  }

  async linkNote(organizationId: string, noteId: string, targetNoteId: string): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    const target = await this.getNoteById(organizationId, targetNoteId); // ensure target exists
    note.linkNote(targetNoteId);
    target.linkNote(noteId);
    await this.noteRepo.save(note);
    await this.noteRepo.save(target);
    return note;
  }

  async unlinkNote(organizationId: string, noteId: string, targetNoteId: string): Promise<Note> {
    const note = await this.getNoteById(organizationId, noteId);
    const target = await this.getNoteById(organizationId, targetNoteId);
    note.unlinkNote(targetNoteId);
    target.unlinkNote(noteId);
    await this.noteRepo.save(note);
    await this.noteRepo.save(target);
    return note;
  }

  async bulkUpdateNotes(organizationId: string, ids: string[], updates: any): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) throw new ValidationError('IDs must be non-empty array');
    return this.noteRepo.bulkUpdate(organizationId, ids, updates);
  }

  async bulkDeleteNotes(organizationId: string, ids: string[]): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) throw new ValidationError('IDs must be non-empty array');
    return this.noteRepo.bulkDelete(organizationId, ids);
  }

  async getTrash(organizationId: string, userId?: string): Promise<{ data: Note[]; total: number }> {
    return this.noteRepo.list({ organizationId, creatorId: userId, isTrash: true });
  }

  async emptyTrash(organizationId: string, userId?: string): Promise<number> {
    return this.noteRepo.emptyTrash(organizationId, userId);
  }

  // ── Comment Methods ──────────────────────────────────────────
  async getComments(noteId: string): Promise<NoteComment[]> {
    return this.commentRepo.findByNoteId(noteId);
  }

  async addComment(
    organizationId: string,
    noteId: string,
    authorId: string,
    content: string,
    parentId?: string | null
  ): Promise<NoteComment> {
    const comment = NoteComment.create({
      id: uuidv4(),
      organizationId,
      noteId,
      authorId,
      content,
      parentId,
    });
    await this.commentRepo.save(comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    const deleted = await this.commentRepo.delete(id);
    if (!deleted) throw new NotFoundError('NoteComment', id);
  }

  async reactToComment(id: string, emoji: string, userId: string): Promise<NoteComment> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) throw new NotFoundError('NoteComment', id);
    comment.toggleReaction(emoji, userId);
    await this.commentRepo.save(comment);
    return comment;
  }
}

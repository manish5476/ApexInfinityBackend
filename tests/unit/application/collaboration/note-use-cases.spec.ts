import { NoteUseCases } from '../../../../src/modules/collaboration/application/use-cases/NoteUseCases';
import { InMemoryNoteRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteRepository';
import { InMemoryNoteCommentRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteCommentRepository';
import { ValidationError, NotFoundError } from '../../../../src/shared/errors';

describe('NoteUseCases', () => {
  let noteRepo: InMemoryNoteRepository;
  let commentRepo: InMemoryNoteCommentRepository;
  let useCases: NoteUseCases;
  const orgId = 'org-collab-1';
  const userId = 'user-creator-1';

  beforeEach(() => {
    noteRepo = new InMemoryNoteRepository();
    commentRepo = new InMemoryNoteCommentRepository();
    useCases = new NoteUseCases(noteRepo, commentRepo);
  });

  describe('createNote', () => {
    it('should successfully create a note work-item', async () => {
      const note = await useCases.createNote(orgId, userId, {
        title: 'Project Roadmap',
        content: 'Q3 deliverables planning',
        itemType: 'note',
        priority: 'high',
        tags: ['strategy', 'roadmap'],
      });

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.title).toBe('Project Roadmap');
      expect(note.status).toBe('draft');
      expect(note.priority).toBe('high');
      expect(note.tags).toEqual(['strategy', 'roadmap']);
      expect(note.isTrash).toBe(false);

      const retrieved = await noteRepo.findById({ id: note.id, organizationId: orgId });
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(note.id);
    });

    it('should throw ValidationError if title is missing or blank', async () => {
      await expect(
        useCases.createNote(orgId, userId, { title: '   ' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getNoteById and getNotes', () => {
    it('should retrieve a note by ID or throw NotFoundError', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Find Me' });
      const found = await useCases.getNoteById(orgId, note.id);
      expect(found.id).toBe(note.id);

      await expect(useCases.getNoteById(orgId, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should list and filter notes by organization', async () => {
      await useCases.createNote(orgId, userId, { title: 'Note 1', itemType: 'note' });
      await useCases.createNote(orgId, userId, { title: 'Task 1', itemType: 'task' });
      await useCases.createNote('other-org', userId, { title: 'Other Org Note' });

      const notesOnly = await useCases.getNotes(orgId, { itemType: 'note' });
      expect(notesOnly.total).toBe(1);
      expect(notesOnly.data[0]?.title).toBe('Note 1');

      const allOrgNotes = await useCases.getNotes(orgId, {});
      expect(allOrgNotes.total).toBe(2);
    });
  });

  describe('updateNote', () => {
    it('should update note title, status and priority', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Initial Title' });
      const updated = await useCases.updateNote(orgId, note.id, {
        title: 'Updated Title',
        status: 'in_progress',
        priority: 'urgent',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('in_progress');
      expect(updated.priority).toBe('urgent');
    });
  });

  describe('deleteNote, trash & restore', () => {
    it('should soft-delete to trash by default and restore', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Trash Me' });

      await useCases.deleteNote(orgId, note.id, false);

      const activeList = await useCases.getNotes(orgId, {});
      expect(activeList.total).toBe(0);

      const trashList = await useCases.getTrash(orgId);
      expect(trashList.total).toBe(1);
      expect(trashList.data[0]?.id).toBe(note.id);

      await useCases.restoreFromTrash(orgId, note.id);
      const restoredList = await useCases.getNotes(orgId, {});
      expect(restoredList.total).toBe(1);
      expect(restoredList.data[0]?.isTrash).toBe(false);
    });

    it('should empty trash permanently', async () => {
      const note1 = await useCases.createNote(orgId, userId, { title: 'Item 1' });
      const note2 = await useCases.createNote(orgId, userId, { title: 'Item 2' });

      await useCases.deleteNote(orgId, note1.id);
      await useCases.deleteNote(orgId, note2.id);

      expect((await useCases.getTrash(orgId)).total).toBe(2);

      await useCases.emptyTrash(orgId);
      expect((await useCases.getTrash(orgId)).total).toBe(0);
    });

    it('should permanently delete an item directly', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Hard Delete' });
      await useCases.deleteNote(orgId, note.id, true);

      const found = await noteRepo.findById({ id: note.id, organizationId: orgId });
      expect(found).toBeNull();
    });
  });

  describe('assignees and checklists', () => {
    it('should assign users and update their assignment status', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Assigned Task' });

      const assigned = await useCases.assignUsers(orgId, note.id, ['dev-1'], userId, 'collaborator');
      expect(assigned.assignees.length).toBe(1);
      expect(assigned.assignees[0]?.user).toBe('dev-1');
      expect(assigned.assignees[0]?.status).toBe('pending');

      const updated = await useCases.updateAssignmentStatus(orgId, note.id, 'dev-1', 'in_progress');
      expect(updated.assignees[0]?.status).toBe('in_progress');
    });

    it('should add, toggle, and remove checklist items', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Checklist Task' });

      const withItem = await useCases.addChecklistItem(orgId, note.id, {
        title: 'Setup repository',
        assignedTo: 'dev-1',
      });
      expect(withItem.checklists.length).toBe(1);
      const itemId = withItem.checklists[0]?.id as string;
      expect(withItem.checklists[0]?.completed).toBe(false);

      const completed = await useCases.toggleChecklistItem(orgId, note.id, itemId, 'dev-1');
      expect(completed).toBe(true);

      const removed = await useCases.removeChecklistItem(orgId, note.id, itemId);
      expect(removed.checklists.length).toBe(0);
    });
  });

  describe('time logs, linking and conversion', () => {
    it('should log time spent', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Task with Time' });
      const now = new Date();
      const later = new Date(now.getTime() + 45 * 60 * 1000);
      const logged = await useCases.addTimeLog(orgId, note.id, userId, {
        startTime: now,
        endTime: later,
        hours: 0.75,
        note: 'Initial architectural review',
      });

      expect(logged.timeLogs.length).toBe(1);
      expect(logged.timeLogs[0]?.hours).toBe(0.75);
      expect(logged.timeLogs[0]?.user).toBe(userId);
    });

    it('should link and unlink notes bidirectionally', async () => {
      const noteA = await useCases.createNote(orgId, userId, { title: 'Feature A' });
      const noteB = await useCases.createNote(orgId, userId, { title: 'Feature B' });

      await useCases.linkNote(orgId, noteA.id, noteB.id);

      const updatedA = await useCases.getNoteById(orgId, noteA.id);
      const updatedB = await useCases.getNoteById(orgId, noteB.id);
      expect(updatedA.linkedNotes).toContain(noteB.id);
      expect(updatedB.linkedNotes).toContain(noteA.id);

      await useCases.unlinkNote(orgId, noteA.id, noteB.id);
      const unlinkedA = await useCases.getNoteById(orgId, noteA.id);
      expect(unlinkedA.linkedNotes).not.toContain(noteB.id);
    });

    it('should duplicate a note', async () => {
      const original = await useCases.createNote(orgId, userId, {
        title: 'Sprint Backlog',
        content: 'Original backlog items',
      });

      const duplicate = await useCases.duplicateNote(orgId, userId, original.id);
      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.title).toBe('Sprint Backlog (Copy)');
      expect(duplicate.content).toBe('Original backlog items');
    });

    it('should convert note to task', async () => {
      const note = await useCases.createNote(orgId, userId, {
        title: 'Idea to convert',
        itemType: 'note',
      });

      const task = await useCases.convertToTask(orgId, note.id);
      expect(task.itemType).toBe('task');
    });

    it('should toggle pin and archive', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Sticky Note' });

      const pinned = await useCases.togglePinNote(orgId, note.id);
      expect(pinned).toBe(true);

      await useCases.archiveNote(orgId, note.id);
      const archived = await useCases.getNoteById(orgId, note.id);
      expect(archived.isArchived).toBe(true);
    });
  });

  describe('comments & reactions', () => {
    it('should add comment, react, and delete comment', async () => {
      const note = await useCases.createNote(orgId, userId, { title: 'Discussion Note' });

      const comment = await useCases.addComment(orgId, note.id, userId, 'Great initiative!');
      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Great initiative!');

      const comments = await useCases.getComments(note.id);
      expect(comments.length).toBe(1);

      const reacted = await useCases.reactToComment(comment.id, '👍', 'colleague-1');
      expect(reacted.reactions.length).toBe(1);
      expect(reacted.reactions[0]?.emoji).toBe('👍');

      await useCases.deleteComment(comment.id);
      const afterDelete = await useCases.getComments(note.id);
      expect(afterDelete.length).toBe(0);
    });
  });
});

import { NoteTemplateUseCases } from '../../../../src/modules/collaboration/application/use-cases/NoteTemplateUseCases';
import { NoteUseCases } from '../../../../src/modules/collaboration/application/use-cases/NoteUseCases';
import { InMemoryNoteTemplateRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteTemplateRepository';
import { InMemoryNoteRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteRepository';
import { InMemoryNoteCommentRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteCommentRepository';
import { ValidationError, NotFoundError } from '../../../../src/shared/errors';

describe('NoteTemplateUseCases', () => {
  let templateRepo: InMemoryNoteTemplateRepository;
  let noteRepo: InMemoryNoteRepository;
  let commentRepo: InMemoryNoteCommentRepository;
  let templateUseCases: NoteTemplateUseCases;
  let noteUseCases: NoteUseCases;
  const orgId = 'org-template-test';
  const userId = 'user-template-admin';

  beforeEach(() => {
    templateRepo = new InMemoryNoteTemplateRepository();
    noteRepo = new InMemoryNoteRepository();
    commentRepo = new InMemoryNoteCommentRepository();
    templateUseCases = new NoteTemplateUseCases(templateRepo);
    noteUseCases = new NoteUseCases(noteRepo, commentRepo);
  });

  describe('createTemplate', () => {
    it('should create template with valid inputs', async () => {
      const template = await templateUseCases.createTemplate(orgId, userId, {
        name: 'Sprint Retro Template',
        description: 'Standard retrospective format',
        itemType: 'note',
        content: '## What went well?\n## What could improve?',
        tags: ['agile', 'retro'],
        checklists: [
          { title: 'Review action items from last sprint', order: 0 },
          { title: 'Gather feedback', order: 1 },
        ],
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Sprint Retro Template');
      expect(template.checklists.length).toBe(2);

      const retrieved = await templateRepo.findById({ id: template.id, organizationId: orgId });
      expect(retrieved?.id).toBe(template.id);
    });

    it('should throw ValidationError if name is empty', async () => {
      await expect(
        templateUseCases.createTemplate(orgId, userId, { name: '  ' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getTemplates & getTemplateById', () => {
    it('should list templates and filter by itemType', async () => {
      await templateUseCases.createTemplate(orgId, userId, { name: 'T1', itemType: 'note' });
      await templateUseCases.createTemplate(orgId, userId, { name: 'T2', itemType: 'task' });
      await templateUseCases.createTemplate('other-org', userId, { name: 'T3', itemType: 'note' });

      const all = await templateUseCases.getTemplates(orgId);
      expect(all.length).toBe(2);

      const tasksOnly = await templateUseCases.getTemplates(orgId, 'task');
      expect(tasksOnly.length).toBe(1);
      expect(tasksOnly[0]?.name).toBe('T2');
    });

    it('should get template by ID or throw NotFoundError', async () => {
      const created = await templateUseCases.createTemplate(orgId, userId, { name: 'Find Me' });
      const found = await templateUseCases.getTemplateById(orgId, created.id);
      expect(found.id).toBe(created.id);

      await expect(templateUseCases.getTemplateById(orgId, 'invalid-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTemplate & deleteTemplate', () => {
    it('should update template properties', async () => {
      const created = await templateUseCases.createTemplate(orgId, userId, { name: 'Initial Name' });
      const updated = await templateUseCases.updateTemplate(orgId, created.id, {
        name: 'Updated Name',
        description: 'New Description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New Description');
    });

    it('should delete template by ID', async () => {
      const created = await templateUseCases.createTemplate(orgId, userId, { name: 'Delete Me' });
      await templateUseCases.deleteTemplate(orgId, created.id);

      await expect(templateUseCases.getTemplateById(orgId, created.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createFromTemplate', () => {
    it('should instantiate a new note work-item pre-populated from a template', async () => {
      const template = await templateUseCases.createTemplate(orgId, userId, {
        name: 'Client Onboarding',
        itemType: 'task',
        content: 'Checklist for onboarding new accounts',
        tags: ['onboarding', 'client'],
        checklists: [
          { title: 'Send welcome email', order: 0 },
          { title: 'Schedule kickoff call', order: 1 },
        ],
      });

      const note = await templateUseCases.createFromTemplate(
        orgId,
        'user-agent-1',
        template.id,
        noteUseCases,
        { title: 'Onboard Acme Corp' }
      );

      expect(note).toBeDefined();
      expect(note.title).toBe('Onboard Acme Corp');
      expect(note.content).toBe('Checklist for onboarding new accounts');
      expect(note.itemType).toBe('task');
      expect(note.tags).toEqual(['onboarding', 'client']);
      expect(note.checklists.length).toBe(2);
      expect(note.checklists[0]?.title).toBe('Send welcome email');
    });
  });
});

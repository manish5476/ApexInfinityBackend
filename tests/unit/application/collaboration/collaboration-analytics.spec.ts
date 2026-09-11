import { CollaborationAnalyticsUseCases } from '../../../../src/modules/collaboration/application/use-cases/CollaborationAnalyticsUseCases';
import { NoteUseCases } from '../../../../src/modules/collaboration/application/use-cases/NoteUseCases';
import { MeetingUseCases } from '../../../../src/modules/collaboration/application/use-cases/MeetingUseCases';
import { InMemoryNoteRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteRepository';
import { InMemoryMeetingRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryMeetingRepository';
import { InMemoryNoteCommentRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteCommentRepository';

describe('CollaborationAnalyticsUseCases', () => {
  let noteRepo: InMemoryNoteRepository;
  let meetingRepo: InMemoryMeetingRepository;
  let commentRepo: InMemoryNoteCommentRepository;
  let noteUseCases: NoteUseCases;
  let meetingUseCases: MeetingUseCases;
  let analyticsUseCases: CollaborationAnalyticsUseCases;
  const orgId = 'org-analytics-test';
  const userId = 'user-analytics-1';

  beforeEach(() => {
    noteRepo = new InMemoryNoteRepository();
    meetingRepo = new InMemoryMeetingRepository();
    commentRepo = new InMemoryNoteCommentRepository();
    noteUseCases = new NoteUseCases(noteRepo, commentRepo);
    meetingUseCases = new MeetingUseCases(meetingRepo);
    analyticsUseCases = new CollaborationAnalyticsUseCases(noteRepo, meetingRepo);
  });

  describe('knowledge graph', () => {
    it('should generate network nodes and links for interconnected notes', async () => {
      const note1 = await noteUseCases.createNote(orgId, userId, { title: 'Backend Arch' });
      const note2 = await noteUseCases.createNote(orgId, userId, { title: 'Frontend Arch' });
      await noteUseCases.linkNote(orgId, note1.id, note2.id);

      const graph = await analyticsUseCases.getKnowledgeGraph(orgId);
      expect(graph.nodes.length).toBe(2);
      expect(graph.links.length).toBeGreaterThan(0);
      expect(graph.links.some((l) => l.source === note1.id && l.target === note2.id)).toBe(true);
    });
  });

  describe('heatmap and activity', () => {
    it('should return heatmap activity data', async () => {
      await noteUseCases.createNote(orgId, userId, { title: 'Today Task' });
      const heatmap = await analyticsUseCases.getHeatmapData(orgId, userId);
      expect(heatmap).toBeDefined();
      expect(typeof heatmap).toBe('object');
    });

    it('should get recent activity', async () => {
      await noteUseCases.createNote(orgId, userId, { title: 'Recent Task' });
      const recent = await analyticsUseCases.getRecentActivity(orgId, userId);
      expect(recent.length).toBe(1);
      expect(recent[0]?.title).toBe('Recent Task');
    });
  });

  describe('calendar view and monthly notes', () => {
    it('should combine scheduled notes and meetings into calendar view', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 86400000);

      await noteUseCases.createNote(orgId, userId, {
        title: 'Deliverable Due',
        dueDate,
      });

      await meetingUseCases.createMeeting(orgId, userId, {
        title: 'Sprint Demo',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const calendar = await analyticsUseCases.getCalendarView(orgId, userId);
      expect(calendar.notes.length).toBe(1);
      expect(calendar.meetings.length).toBe(1);
    });

    it('should return monthly notes', async () => {
      await noteUseCases.createNote(orgId, userId, {
        title: 'Monthly Note',
        startDate: new Date(),
      });

      const monthly = await analyticsUseCases.getMonthlyNotes(orgId, userId);
      expect(Array.isArray(monthly)).toBe(true);
    });
  });

  describe('stats summary and export', () => {
    it('should aggregate notes and meetings stats', async () => {
      await noteUseCases.createNote(orgId, userId, { title: 'Stat Note' });
      await meetingUseCases.createMeeting(orgId, userId, {
        title: 'Stat Meeting',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      });

      const stats = await analyticsUseCases.getStatsSummary(orgId, userId);
      expect(stats.notes).toBeDefined();
      expect(stats.meetings).toBeDefined();
    });

    it('should export all notes and meetings for organization', async () => {
      await noteUseCases.createNote(orgId, userId, { title: 'Export Note' });
      await meetingUseCases.createMeeting(orgId, userId, {
        title: 'Export Meeting',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      });

      const exported = await analyticsUseCases.exportData(orgId, userId);
      expect(exported.notes.length).toBe(1);
      expect(exported.meetings.length).toBe(1);
    });
  });
});

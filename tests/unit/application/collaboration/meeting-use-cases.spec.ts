import { MeetingUseCases } from '../../../../src/modules/collaboration/application/use-cases/MeetingUseCases';
import { NoteUseCases } from '../../../../src/modules/collaboration/application/use-cases/NoteUseCases';
import { InMemoryMeetingRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryMeetingRepository';
import { InMemoryNoteRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteRepository';
import { InMemoryNoteCommentRepository } from '../../../../src/modules/collaboration/infrastructure/repositories/InMemoryNoteCommentRepository';
import { ValidationError, NotFoundError } from '../../../../src/shared/errors';

describe('MeetingUseCases', () => {
  let meetingRepo: InMemoryMeetingRepository;
  let noteRepo: InMemoryNoteRepository;
  let commentRepo: InMemoryNoteCommentRepository;
  let meetingUseCases: MeetingUseCases;
  let noteUseCases: NoteUseCases;
  const orgId = 'org-meeting-test';
  const creatorId = 'user-organizer-1';

  beforeEach(() => {
    meetingRepo = new InMemoryMeetingRepository();
    noteRepo = new InMemoryNoteRepository();
    commentRepo = new InMemoryNoteCommentRepository();
    meetingUseCases = new MeetingUseCases(meetingRepo);
    noteUseCases = new NoteUseCases(noteRepo, commentRepo);
  });

  describe('createMeeting', () => {
    it('should create a meeting with valid parameters', async () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Weekly Standup',
        description: 'Sync on weekly goals',
        startTime: now,
        endTime: oneHourLater,
        meetingType: 'virtual',
      });

      expect(meeting.id).toBeDefined();
      expect(meeting.title).toBe('Weekly Standup');
      expect(meeting.status).toBe('scheduled');
      expect(meeting.creatorId).toBe(creatorId);

      const retrieved = await meetingRepo.findById({ id: meeting.id, organizationId: orgId });
      expect(retrieved?.id).toBe(meeting.id);
    });

    it('should throw ValidationError on empty title or invalid times', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10000);

      await expect(
        meetingUseCases.createMeeting(orgId, creatorId, {
          title: '',
          startTime: now,
          endTime: new Date(now.getTime() + 1000),
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        meetingUseCases.createMeeting(orgId, creatorId, {
          title: 'Invalid times',
          startTime: now,
          endTime: past,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getMeetings & getMeetingById', () => {
    it('should retrieve meeting by id or throw NotFoundError', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Find Me Meeting',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const found = await meetingUseCases.getMeetingById(orgId, meeting.id);
      expect(found.title).toBe('Find Me Meeting');

      await expect(meetingUseCases.getMeetingById(orgId, 'missing-id')).rejects.toThrow(NotFoundError);
    });

    it('should list meetings for organization', async () => {
      const now = new Date();
      await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'M1',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });
      await meetingUseCases.createMeeting('other-org', creatorId, {
        title: 'Other Org M',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const list = await meetingUseCases.getMeetings(orgId, {});
      expect(list.total).toBe(1);
      expect(list.data[0]?.title).toBe('M1');
    });
  });

  describe('updateMeeting & cancelMeeting', () => {
    it('should update meeting title and cancel meeting', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Before Update',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const updated = await meetingUseCases.updateMeeting(orgId, meeting.id, {
        title: 'After Update',
        description: 'New agenda',
      });
      expect(updated.title).toBe('After Update');

      await meetingUseCases.cancelMeeting(orgId, meeting.id);
      const cancelled = await meetingUseCases.getMeetingById(orgId, meeting.id);
      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('participants, RSVP, and join/leave', () => {
    it('should add participant, respond to RSVP, join and leave', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Architecture Review',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      await meetingUseCases.addParticipants(orgId, meeting.id, [
        { user: 'engineer-1', role: 'presenter', invitationStatus: 'pending' },
      ]);

      const afterAdd = await meetingUseCases.getMeetingById(orgId, meeting.id);
      expect(afterAdd.participants.length).toBe(2);
      expect(afterAdd.participants.some((p) => p.user === 'engineer-1')).toBe(true);

      await meetingUseCases.respondRSVP(orgId, meeting.id, 'engineer-1', 'accepted');
      const afterRsvp = await meetingUseCases.getMeetingById(orgId, meeting.id);
      const engRsvp = afterRsvp.participants.find((p) => p.user === 'engineer-1');
      expect(engRsvp?.invitationStatus).toBe('accepted');

      await meetingUseCases.joinMeeting(orgId, meeting.id, 'engineer-1');
      const afterJoin = await meetingUseCases.getMeetingById(orgId, meeting.id);
      const engJoin = afterJoin.participants.find((p) => p.user === 'engineer-1');
      expect(engJoin?.attended).toBe(true);

      await meetingUseCases.leaveMeeting(orgId, meeting.id, 'engineer-1');

      await meetingUseCases.removeParticipant(orgId, meeting.id, 'engineer-1');
      const afterRemove = await meetingUseCases.getMeetingById(orgId, meeting.id);
      expect(afterRemove.participants.length).toBe(1);
      expect(afterRemove.participants.some((p) => p.user === 'engineer-1')).toBe(false);
    });
  });

  describe('action items and conversion to task', () => {
    it('should add action item and convert it to task work-item', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Sprint Planning',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const withAction = await meetingUseCases.addActionItem(orgId, meeting.id, {
        title: 'Write unit tests for authentication',
        description: 'Complete auth coverage',
        priority: 'high',
      });
      expect(withAction.actionItems.length).toBe(1);
      const actionItemId = withAction.actionItems[0]?.id as string;

      const converted = await meetingUseCases.convertActionItemToTask(
        orgId,
        meeting.id,
        actionItemId,
        creatorId,
        noteUseCases
      );

      expect(converted.task).toBeDefined();
      expect(converted.task.title).toBe('Write unit tests for authentication');
      expect(converted.task.itemType).toBe('task');
      expect(converted.task.priority).toBe('high');

      const meetingAfter = await meetingUseCases.getMeetingById(orgId, meeting.id);
      expect(meetingAfter.actionItems[0]?.noteId).toBe(converted.task.id);
    });
  });

  describe('polls and voting', () => {
    it('should create poll and record votes', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Release Decision',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      const withPoll = await meetingUseCases.createPoll(orgId, meeting.id, {
        question: 'Ready to deploy to production?',
        options: ['Yes', 'No', 'Need more testing'],
      });

      expect(withPoll.polls.length).toBe(1);
      const poll = withPoll.polls[0]!;
      expect(poll.options.length).toBe(3);
      const optionYesId = poll.options[0]?.id as string;

      const afterVote = await meetingUseCases.votePoll(orgId, meeting.id, poll.id, optionYesId, 'voter-1');
      const votedOption = afterVote.polls[0]?.options.find((o) => o.id === optionYesId);
      expect(votedOption?.votes).toContain('voter-1');
    });

    it('should throw ValidationError if poll has fewer than 2 options', async () => {
      const now = new Date();
      const meeting = await meetingUseCases.createMeeting(orgId, creatorId, {
        title: 'Bad Poll',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      await expect(
        meetingUseCases.createPoll(orgId, meeting.id, {
          question: 'Single option?',
          options: ['One'],
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('analytics', () => {
    it('should get meeting analytics summary', async () => {
      const summary = await meetingUseCases.getMeetingAnalytics(orgId, creatorId);
      expect(summary).toBeDefined();
      expect(summary.totalMeetings).toBeDefined();
    });
  });
});

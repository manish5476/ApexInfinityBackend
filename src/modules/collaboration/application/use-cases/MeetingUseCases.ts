import { v4 as uuidv4 } from 'uuid';
import { IMeetingRepository, MeetingListQuery } from '../../domain/ports/IMeetingRepository';
import { Meeting, MeetingParticipant, MeetingActionItem, MeetingPoll, MeetingType } from '../../domain/entities/Meeting';
import { NotFoundError, ValidationError } from '../../../../shared/errors';
import { NoteUseCases } from './NoteUseCases';

export class MeetingUseCases {
  constructor(private readonly meetingRepo: IMeetingRepository) {}

  async createMeeting(
    organizationId: string,
    creatorId: string,
    params: {
      title: string;
      description?: string | null;
      meetingType?: MeetingType;
      startTime: Date;
      endTime: Date;
      timeZone?: string;
      location?: { address?: string; room?: string; virtualLink?: string; provider?: string } | null;
      participants?: MeetingParticipant[];
      noteId?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Meeting> {
    if (!params.title || !params.title.trim()) {
      throw new ValidationError('Meeting title is required');
    }
    if (!params.startTime || !params.endTime) {
      throw new ValidationError('Start time and end time are required');
    }
    if (new Date(params.startTime) >= new Date(params.endTime)) {
      throw new ValidationError('End time must be strictly after start time');
    }

    const meeting = Meeting.create({
      id: uuidv4(),
      organizationId,
      creatorId,
      ...params,
      startTime: new Date(params.startTime),
      endTime: new Date(params.endTime),
    });

    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async getMeetings(
    organizationId: string,
    query: Omit<MeetingListQuery, 'organizationId'>
  ): Promise<{ data: Meeting[]; total: number }> {
    return this.meetingRepo.list({ organizationId, ...query });
  }

  async getMeetingById(organizationId: string, id: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findById({ id, organizationId });
    if (!meeting) throw new NotFoundError('Meeting', id);
    return meeting;
  }

  async updateMeeting(
    organizationId: string,
    id: string,
    updates: Parameters<Meeting['updateDetails']>[0]
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, id);
    meeting.updateDetails(updates);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async cancelMeeting(organizationId: string, id: string): Promise<void> {
    const meeting = await this.getMeetingById(organizationId, id);
    meeting.cancel();
    await this.meetingRepo.save(meeting);
  }

  async respondRSVP(
    organizationId: string,
    meetingId: string,
    userId: string,
    status: 'pending' | 'accepted' | 'declined' | 'tentative',
    note?: string
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.respondRSVP(userId, status, note);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async joinMeeting(organizationId: string, meetingId: string, userId: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.joinMeeting(userId);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async leaveMeeting(organizationId: string, meetingId: string, userId: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.leaveMeeting(userId);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async addParticipants(
    organizationId: string,
    meetingId: string,
    participants: Array<Omit<MeetingParticipant, 'id' | 'invitedAt' | 'attended' | 'durationMinutes' | 'receiveRecording'>>
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    for (const p of participants) {
      meeting.addParticipant({
        id: uuidv4(),
        user: p.user || null,
        externalEmail: p.externalEmail || null,
        externalName: p.externalName || null,
        role: p.role || 'attendee',
        invitationStatus: p.invitationStatus || 'pending',
        invitedAt: new Date(),
        attended: false,
        durationMinutes: 0,
        receiveRecording: false,
      });
    }
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async removeParticipant(organizationId: string, meetingId: string, userId: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.removeParticipant(userId);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async addActionItem(
    organizationId: string,
    meetingId: string,
    params: { title: string; description?: string | null; assignedTo?: string | null; dueDate?: Date | null; priority?: 'low' | 'medium' | 'high' | 'urgent' }
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.addActionItem({
      id: uuidv4(),
      title: params.title,
      description: params.description || null,
      assignedTo: params.assignedTo || null,
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
      status: 'open',
      priority: params.priority || 'medium',
    });
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async convertActionItemToTask(
    organizationId: string,
    meetingId: string,
    actionItemId: string,
    creatorId: string,
    noteUseCases: NoteUseCases
  ): Promise<{ meeting: Meeting; task: any }> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    const actionItem = meeting.actionItems.find((a) => a.id === actionItemId);
    if (!actionItem) throw new NotFoundError('ActionItem', actionItemId);

    const task = await noteUseCases.createNote(organizationId, creatorId, {
      title: actionItem.title,
      content: actionItem.description || `Converted from meeting: ${meeting.title}`,
      itemType: 'task',
      status: 'open',
      priority: actionItem.priority,
      dueDate: actionItem.dueDate,
    });

    meeting.convertActionItemToTask(actionItemId, task.id);
    await this.meetingRepo.save(meeting);
    return { meeting, task };
  }

  async createPoll(
    organizationId: string,
    meetingId: string,
    params: { question: string; options: string[] }
  ): Promise<Meeting> {
    if (!params.question || !params.options || params.options.length < 2) {
      throw new ValidationError('Poll requires question and at least 2 options');
    }
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.createPoll({
      id: uuidv4(),
      question: params.question,
      options: params.options.map((opt) => ({
        id: uuidv4(),
        text: opt,
        votes: [],
      })),
      isClosed: false,
      createdAt: new Date(),
    });
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async votePoll(
    organizationId: string,
    meetingId: string,
    pollId: string,
    optionId: string,
    userId: string
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(organizationId, meetingId);
    meeting.votePoll(pollId, optionId, userId);
    await this.meetingRepo.save(meeting);
    return meeting;
  }

  async getMeetingAnalytics(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    return this.meetingRepo.getAnalyticsSummary(organizationId, userId);
  }
}

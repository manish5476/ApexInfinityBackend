import { AggregateRoot } from '../../../../core/domain/AggregateRoot';

export type MeetingType = 'in_person' | 'virtual' | 'hybrid';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ParticipantRole = 'organizer' | 'presenter' | 'attendee' | 'note_taker' | 'observer' | 'guest';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'tentative' | 'not_sent';

export interface MeetingParticipant {
  id: string;
  user?: string | null;
  externalEmail?: string | null;
  externalName?: string | null;
  role: ParticipantRole;
  invitationStatus: InvitationStatus;
  invitedAt: Date;
  respondedAt?: Date | null;
  responseNote?: string | null;
  attended: boolean;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  durationMinutes: number;
  receiveRecording: boolean;
}

export interface MeetingActionItem {
  id: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  dueDate?: Date | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  completedAt?: Date | null;
  noteId?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MeetingPollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface MeetingPoll {
  id: string;
  question: string;
  options: MeetingPollOption[];
  isClosed: boolean;
  createdAt: Date;
}

export interface MeetingLocation {
  address?: string | null;
  room?: string | null;
  virtualLink?: string | null;
  provider?: string | null;
}

export interface MeetingProps {
  organizationId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  location?: MeetingLocation | null;
  participants: MeetingParticipant[];
  actionItems: MeetingActionItem[];
  polls: MeetingPoll[];
  noteId?: string | null;
  recordingUrl?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Meeting extends AggregateRoot<string> {
  private _props: MeetingProps;

  private constructor(id: string, props: MeetingProps) {
    super(id);
    this._props = props;
  }

  static create(params: {
    id: string;
    organizationId: string;
    creatorId: string;
    title: string;
    description?: string | null;
    meetingType?: MeetingType;
    startTime: Date;
    endTime: Date;
    timeZone?: string;
    location?: MeetingLocation | null;
    participants?: MeetingParticipant[];
    noteId?: string | null;
    metadata?: Record<string, unknown>;
  }): Meeting {
    if (!params.title || !params.title.trim()) {
      throw new Error('Meeting title is required');
    }
    if (params.startTime >= params.endTime) {
      throw new Error('Meeting end time must be after start time');
    }

    const now = new Date();

    // Default organizer participant
    const participants: MeetingParticipant[] = params.participants || [
      {
        id: 'p-organizer',
        user: params.creatorId,
        role: 'organizer',
        invitationStatus: 'accepted',
        invitedAt: now,
        respondedAt: now,
        attended: true,
        durationMinutes: 0,
        receiveRecording: true,
      },
    ];

    return new Meeting(params.id, {
      organizationId: params.organizationId,
      creatorId: params.creatorId,
      title: params.title.trim(),
      description: params.description || null,
      meetingType: params.meetingType || 'virtual',
      status: 'scheduled',
      startTime: params.startTime,
      endTime: params.endTime,
      timeZone: params.timeZone || 'UTC',
      location: params.location || null,
      participants,
      actionItems: [],
      polls: [],
      noteId: params.noteId || null,
      recordingUrl: null,
      metadata: params.metadata || {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MeetingProps & { id: string }): Meeting {
    return new Meeting(props.id, props);
  }

  get props(): Readonly<MeetingProps> {
    return { ...this._props };
  }

  get organizationId(): string {
    return this._props.organizationId;
  }

  get creatorId(): string {
    return this._props.creatorId;
  }

  get title(): string {
    return this._props.title;
  }

  get status(): MeetingStatus {
    return this._props.status;
  }

  get startTime(): Date {
    return this._props.startTime;
  }

  get endTime(): Date {
    return this._props.endTime;
  }

  get participants(): ReadonlyArray<MeetingParticipant> {
    return [...this._props.participants];
  }

  get actionItems(): ReadonlyArray<MeetingActionItem> {
    return [...this._props.actionItems];
  }

  get polls(): ReadonlyArray<MeetingPoll> {
    return [...this._props.polls];
  }

  updateDetails(params: Partial<{
    title: string;
    description: string | null;
    meetingType: MeetingType;
    startTime: Date;
    endTime: Date;
    timeZone: string;
    location: MeetingLocation | null;
    recordingUrl: string | null;
    metadata: Record<string, unknown>;
  }>): void {
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new Error('Meeting title cannot be empty');
      this._props.title = params.title.trim();
    }
    if (params.description !== undefined) this._props.description = params.description;
    if (params.meetingType !== undefined) this._props.meetingType = params.meetingType;
    if (params.startTime !== undefined) this._props.startTime = params.startTime;
    if (params.endTime !== undefined) this._props.endTime = params.endTime;
    if (params.timeZone !== undefined) this._props.timeZone = params.timeZone;
    if (params.location !== undefined) this._props.location = params.location;
    if (params.recordingUrl !== undefined) this._props.recordingUrl = params.recordingUrl;
    if (params.metadata !== undefined) {
      this._props.metadata = { ...this._props.metadata, ...params.metadata };
    }
    this._props.updatedAt = new Date();
  }

  cancel(): void {
    this._props.status = 'cancelled';
    this._props.updatedAt = new Date();
  }

  respondRSVP(userId: string, status: InvitationStatus, note?: string): void {
    const p = this._props.participants.find((x) => x.user === userId);
    if (!p) throw new Error(`Participant with user ID ${userId} not found in this meeting`);
    p.invitationStatus = status;
    p.respondedAt = new Date();
    if (note) p.responseNote = note;
    this._props.updatedAt = new Date();
  }

  joinMeeting(userId: string): void {
    let p = this._props.participants.find((x) => x.user === userId);
    if (!p) {
      p = {
        id: `p-${Date.now()}`,
        user: userId,
        role: 'attendee',
        invitationStatus: 'accepted',
        invitedAt: new Date(),
        respondedAt: new Date(),
        attended: true,
        joinedAt: new Date(),
        durationMinutes: 0,
        receiveRecording: false,
      };
      this._props.participants.push(p);
    } else {
      p.attended = true;
      p.joinedAt = new Date();
    }
    if (this._props.status === 'scheduled') {
      this._props.status = 'in_progress';
    }
    this._props.updatedAt = new Date();
  }

  leaveMeeting(userId: string): void {
    const p = this._props.participants.find((x) => x.user === userId);
    if (p && p.joinedAt) {
      p.leftAt = new Date();
      const diffMs = p.leftAt.getTime() - p.joinedAt.getTime();
      p.durationMinutes = Math.round(diffMs / 60000);
      this._props.updatedAt = new Date();
    }
  }

  addParticipant(participant: MeetingParticipant): void {
    const exists = this._props.participants.some(
      (p) => (participant.user && p.user === participant.user) ||
             (participant.externalEmail && p.externalEmail === participant.externalEmail)
    );
    if (!exists) {
      this._props.participants.push(participant);
      this._props.updatedAt = new Date();
    }
  }

  removeParticipant(userId: string): void {
    this._props.participants = this._props.participants.filter((p) => p.user !== userId);
    this._props.updatedAt = new Date();
  }

  addActionItem(item: MeetingActionItem): void {
    this._props.actionItems.push(item);
    this._props.updatedAt = new Date();
  }

  convertActionItemToTask(actionItemId: string, taskId: string): void {
    const item = this._props.actionItems.find((a) => a.id === actionItemId);
    if (!item) throw new Error(`Action item ${actionItemId} not found`);
    item.noteId = taskId;
    this._props.updatedAt = new Date();
  }

  createPoll(poll: MeetingPoll): void {
    this._props.polls.push(poll);
    this._props.updatedAt = new Date();
  }

  votePoll(pollId: string, optionId: string, userId: string): void {
    const poll = this._props.polls.find((p) => p.id === pollId);
    if (!poll) throw new Error(`Poll ${pollId} not found`);
    if (poll.isClosed) throw new Error(`Poll ${pollId} is closed`);

    // Remove user previous vote across options
    for (const opt of poll.options) {
      opt.votes = opt.votes.filter((v) => v !== userId);
    }
    const targetOption = poll.options.find((opt) => opt.id === optionId);
    if (!targetOption) throw new Error(`Option ${optionId} not found in poll`);
    targetOption.votes.push(userId);
    this._props.updatedAt = new Date();
  }
}

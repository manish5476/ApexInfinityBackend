import mongoose, { Schema, Document, Model } from 'mongoose';

export interface NoteDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  creatorId: string;
  title: string;
  content: string;
  itemType: string;
  status: string;
  priority: string;
  visibility: string;
  assignees: any[];
  checklists: any[];
  timeLogs: any[];
  tags: string[];
  linkedNotes: string[];
  attachments: any[];
  location?: any;
  sharedWith: any[];
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  trashedAt?: Date | null;
  color?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    creatorId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    itemType: { type: String, default: 'note', index: true },
    status: { type: String, default: 'draft', index: true },
    priority: { type: String, default: 'none', index: true },
    visibility: { type: String, default: 'private' },
    assignees: { type: [Schema.Types.Mixed], default: [] },
    checklists: { type: [Schema.Types.Mixed], default: [] },
    timeLogs: { type: [Schema.Types.Mixed], default: [] },
    tags: { type: [String], default: [], index: true },
    linkedNotes: { type: [String], default: [] },
    attachments: { type: [Schema.Types.Mixed], default: [] },
    location: { type: Schema.Types.Mixed, default: null },
    sharedWith: { type: [Schema.Types.Mixed], default: [] },
    isPinned: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    isTrash: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
    color: { type: String, default: null },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    _id: false,
  }
);

noteSchema.index({ organizationId: 1, isTrash: 1, isArchived: 1 });
noteSchema.index({ organizationId: 1, 'assignees.user': 1 });
noteSchema.index({ organizationId: 1, 'sharedWith.user': 1 });

export const FwNote: Model<NoteDoc> =
  (mongoose.models.FwNote as Model<NoteDoc>) || mongoose.model<NoteDoc>('FwNote', noteSchema);

// ─────────────────────────────────────────────
// Meeting Schema
// ─────────────────────────────────────────────

export interface MeetingDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  meetingType: string;
  status: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  location?: any;
  participants: any[];
  actionItems: any[];
  polls: any[];
  noteId?: string | null;
  recordingUrl?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    creatorId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    meetingType: { type: String, default: 'virtual' },
    status: { type: String, default: 'scheduled', index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    timeZone: { type: String, default: 'UTC' },
    location: { type: Schema.Types.Mixed, default: null },
    participants: { type: [Schema.Types.Mixed], default: [] },
    actionItems: { type: [Schema.Types.Mixed], default: [] },
    polls: { type: [Schema.Types.Mixed], default: [] },
    noteId: { type: String, default: null },
    recordingUrl: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    _id: false,
  }
);

meetingSchema.index({ organizationId: 1, 'participants.user': 1 });

export const FwMeeting: Model<MeetingDoc> =
  (mongoose.models.FwMeeting as Model<MeetingDoc>) || mongoose.model<MeetingDoc>('FwMeeting', meetingSchema);

// ─────────────────────────────────────────────
// NoteComment Schema
// ─────────────────────────────────────────────

export interface NoteCommentDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  noteId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  reactions: any[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteCommentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    noteId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    parentId: { type: String, default: null },
    reactions: { type: [Schema.Types.Mixed], default: [] },
    isEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const FwNoteComment: Model<NoteCommentDoc> =
  (mongoose.models.FwNoteComment as Model<NoteCommentDoc>) || mongoose.model<NoteCommentDoc>('FwNoteComment', noteCommentSchema);

// ─────────────────────────────────────────────
// NoteTemplate Schema
// ─────────────────────────────────────────────

export interface NoteTemplateDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  itemType: string;
  content: string;
  checklists: any[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteTemplateSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    itemType: { type: String, default: 'note' },
    content: { type: String, default: '' },
    checklists: { type: [Schema.Types.Mixed], default: [] },
    tags: { type: [String], default: [] },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const FwNoteTemplate: Model<NoteTemplateDoc> =
  (mongoose.models.FwNoteTemplate as Model<NoteTemplateDoc>) || mongoose.model<NoteTemplateDoc>('FwNoteTemplate', noteTemplateSchema);

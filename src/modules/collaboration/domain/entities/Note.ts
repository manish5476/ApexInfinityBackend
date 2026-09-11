import { AggregateRoot } from '../../../../core/domain/AggregateRoot';

export type NoteItemType = 'note' | 'task' | 'idea' | 'journal' | 'project' | 'meeting_note';
export type NoteStatus = 'draft' | 'open' | 'in_progress' | 'in_review' | 'done' | 'archived' | 'cancelled' | 'active' | 'completed' | 'deferred';
export type NotePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type NoteVisibility = 'private' | 'assignees' | 'team' | 'department' | 'organization';

export interface NoteAssignee {
  id: string;
  user: string;
  assignedBy: string;
  assignedAt: Date;
  role: 'owner' | 'collaborator' | 'reviewer' | 'observer';
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'done' | 'verified';
  acceptedAt?: Date | null;
  completedAt?: Date | null;
  estimatedHours?: number;
  loggedHours?: number;
  notes?: string | null;
}

export interface NoteChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date | null;
  completedBy?: string | null;
  assignedTo?: string | null;
  dueDate?: Date | null;
  order: number;
}

export interface NoteTimeLog {
  id: string;
  user: string;
  startTime: Date;
  endTime?: Date | null;
  hours?: number | null;
  note?: string | null;
}

export interface NoteLocation {
  geoJson?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  accuracy?: number | null;
}

export interface NoteAttachment {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface NoteSharedUser {
  user: string;
  role: 'view' | 'edit' | 'admin';
}

export interface NoteProps {
  organizationId: string;
  creatorId: string;
  title: string;
  content: string;
  itemType: NoteItemType;
  status: NoteStatus;
  priority: NotePriority;
  visibility: NoteVisibility;
  assignees: NoteAssignee[];
  checklists: NoteChecklistItem[];
  timeLogs: NoteTimeLog[];
  tags: string[];
  linkedNotes: string[];
  attachments: NoteAttachment[];
  location?: NoteLocation | null;
  sharedWith: NoteSharedUser[];
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

export class Note extends AggregateRoot<string> {
  private _props: NoteProps;

  private constructor(id: string, props: NoteProps) {
    super(id);
    this._props = props;
  }

  static create(params: {
    id: string;
    organizationId: string;
    creatorId: string;
    title: string;
    content?: string;
    itemType?: NoteItemType;
    status?: NoteStatus;
    priority?: NotePriority;
    visibility?: NoteVisibility;
    assignees?: NoteAssignee[];
    checklists?: NoteChecklistItem[];
    tags?: string[];
    linkedNotes?: string[];
    attachments?: NoteAttachment[];
    location?: NoteLocation | null;
    sharedWith?: NoteSharedUser[];
    color?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    metadata?: Record<string, unknown>;
  }): Note {
    if (!params.title || !params.title.trim()) {
      throw new Error('Note title cannot be empty');
    }

    const now = new Date();
    const itemType = params.itemType || 'note';
    const status = params.status || (itemType === 'task' ? 'open' : 'draft');

    return new Note(params.id, {
      organizationId: params.organizationId,
      creatorId: params.creatorId,
      title: params.title.trim(),
      content: params.content || '',
      itemType,
      status,
      priority: params.priority || 'none',
      visibility: params.visibility || 'private',
      assignees: params.assignees || [],
      checklists: params.checklists || [],
      timeLogs: [],
      tags: params.tags || [],
      linkedNotes: params.linkedNotes || [],
      attachments: params.attachments || [],
      location: params.location || null,
      sharedWith: params.sharedWith || [],
      isPinned: false,
      isArchived: false,
      isTrash: false,
      trashedAt: null,
      color: params.color || null,
      startDate: params.startDate || null,
      dueDate: params.dueDate || null,
      completedAt: null,
      metadata: params.metadata || {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: NoteProps & { id: string }): Note {
    return new Note(props.id, props);
  }

  get props(): Readonly<NoteProps> {
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

  get content(): string {
    return this._props.content;
  }

  get itemType(): NoteItemType {
    return this._props.itemType;
  }

  get status(): NoteStatus {
    return this._props.status;
  }

  get priority(): NotePriority {
    return this._props.priority;
  }

  get visibility(): NoteVisibility {
    return this._props.visibility;
  }

  get isPinned(): boolean {
    return this._props.isPinned;
  }

  get isArchived(): boolean {
    return this._props.isArchived;
  }

  get isTrash(): boolean {
    return this._props.isTrash;
  }

  get assignees(): ReadonlyArray<NoteAssignee> {
    return [...this._props.assignees];
  }

  get checklists(): ReadonlyArray<NoteChecklistItem> {
    return [...this._props.checklists];
  }

  get timeLogs(): ReadonlyArray<NoteTimeLog> {
    return [...this._props.timeLogs];
  }

  get tags(): ReadonlyArray<string> {
    return [...this._props.tags];
  }

  get linkedNotes(): ReadonlyArray<string> {
    return [...this._props.linkedNotes];
  }

  get sharedWith(): ReadonlyArray<NoteSharedUser> {
    return [...this._props.sharedWith];
  }

  updateDetails(params: Partial<{
    title: string;
    content: string;
    itemType: NoteItemType;
    status: NoteStatus;
    priority: NotePriority;
    visibility: NoteVisibility;
    color?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }>): void {
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new Error('Note title cannot be empty');
      this._props.title = params.title.trim();
    }
    if (params.content !== undefined) this._props.content = params.content;
    if (params.itemType !== undefined) this._props.itemType = params.itemType;
    if (params.status !== undefined) {
      this._props.status = params.status;
      if (params.status === 'done' || params.status === 'completed') {
        this._props.completedAt = new Date();
      } else {
        this._props.completedAt = null;
      }
    }
    if (params.priority !== undefined) this._props.priority = params.priority;
    if (params.visibility !== undefined) this._props.visibility = params.visibility;
    if (params.color !== undefined) this._props.color = params.color;
    if (params.startDate !== undefined) this._props.startDate = params.startDate;
    if (params.dueDate !== undefined) this._props.dueDate = params.dueDate;
    if (params.tags !== undefined) this._props.tags = params.tags;
    if (params.metadata !== undefined) {
      this._props.metadata = { ...this._props.metadata, ...params.metadata };
    }
    this._props.updatedAt = new Date();
  }

  togglePin(): boolean {
    this._props.isPinned = !this._props.isPinned;
    this._props.updatedAt = new Date();
    return this._props.isPinned;
  }

  archive(): void {
    this._props.isArchived = true;
    this._props.updatedAt = new Date();
  }

  unarchive(): void {
    this._props.isArchived = false;
    this._props.updatedAt = new Date();
  }

  moveToTrash(): void {
    this._props.isTrash = true;
    this._props.trashedAt = new Date();
    this._props.updatedAt = new Date();
  }

  restoreFromTrash(): void {
    this._props.isTrash = false;
    this._props.trashedAt = null;
    this._props.updatedAt = new Date();
  }

  convertToTask(): void {
    this._props.itemType = 'task';
    if (this._props.status === 'draft') {
      this._props.status = 'open';
    }
    this._props.updatedAt = new Date();
  }

  addChecklistItem(item: NoteChecklistItem): void {
    this._props.checklists.push(item);
    this._props.updatedAt = new Date();
  }

  toggleChecklistItem(itemId: string, userId?: string): boolean {
    const item = this._props.checklists.find((c) => c.id === itemId);
    if (!item) throw new Error(`Checklist item ${itemId} not found`);
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    item.completedBy = item.completed ? userId || null : null;
    this._props.updatedAt = new Date();
    return item.completed;
  }

  removeChecklistItem(itemId: string): void {
    this._props.checklists = this._props.checklists.filter((c) => c.id !== itemId);
    this._props.updatedAt = new Date();
  }

  addTimeLog(entry: NoteTimeLog): void {
    this._props.timeLogs.push(entry);
    this._props.updatedAt = new Date();
  }

  assignUsers(assignees: NoteAssignee[]): void {
    const existingIds = new Set(this._props.assignees.map((a) => a.user));
    for (const a of assignees) {
      if (!existingIds.has(a.user)) {
        this._props.assignees.push(a);
      }
    }
    this._props.updatedAt = new Date();
  }

  updateAssignmentStatus(
    userId: string,
    status: NoteAssignee['status'],
    notes?: string
  ): void {
    const assignee = this._props.assignees.find((a) => a.user === userId);
    if (!assignee) throw new Error(`User ${userId} is not assigned to this item`);
    assignee.status = status;
    if (status === 'accepted') assignee.acceptedAt = new Date();
    if (status === 'done' || status === 'verified') assignee.completedAt = new Date();
    if (notes) assignee.notes = notes;
    this._props.updatedAt = new Date();
  }

  shareWithUser(user: string, role: 'view' | 'edit' | 'admin'): void {
    const existing = this._props.sharedWith.find((s) => s.user === user);
    if (existing) {
      existing.role = role;
    } else {
      this._props.sharedWith.push({ user, role });
    }
    this._props.updatedAt = new Date();
  }

  removeSharedUser(user: string): void {
    this._props.sharedWith = this._props.sharedWith.filter((s) => s.user !== user);
    this._props.updatedAt = new Date();
  }

  linkNote(targetNoteId: string): void {
    if (!this._props.linkedNotes.includes(targetNoteId) && targetNoteId !== this.id) {
      this._props.linkedNotes.push(targetNoteId);
      this._props.updatedAt = new Date();
    }
  }

  unlinkNote(targetNoteId: string): void {
    this._props.linkedNotes = this._props.linkedNotes.filter((id) => id !== targetNoteId);
    this._props.updatedAt = new Date();
  }
}

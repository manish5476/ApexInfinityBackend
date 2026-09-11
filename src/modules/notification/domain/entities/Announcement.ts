import { AggregateRoot } from '../../../../core/domain/AggregateRoot';

export type AnnouncementType = 'info' | 'warning' | 'success' | 'urgent';
export type AnnouncementAudience = 'all' | 'role' | 'specific';

export interface AnnouncementProps {
  organizationId: string;
  senderId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetAudience: AnnouncementAudience;
  targetRoles: string[];
  targetUsers: string[];
  isPinned: boolean;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementParams {
  id: string;
  organizationId: string;
  senderId: string;
  title: string;
  message: string;
  type?: AnnouncementType;
  targetAudience?: AnnouncementAudience;
  targetRoles?: string[];
  targetUsers?: string[];
  isPinned?: boolean;
  expiresAt?: Date | null;
}

export class Announcement extends AggregateRoot<string> {
  private _props: AnnouncementProps;

  private constructor(id: string, props: AnnouncementProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateAnnouncementParams): Announcement {
    if (!params.title.trim()) {
      throw new Error('Announcement title is required');
    }
    if (!params.message.trim()) {
      throw new Error('Announcement message is required');
    }

    const now = new Date();
    return new Announcement(params.id, {
      organizationId: params.organizationId,
      senderId: params.senderId,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type ?? 'info',
      targetAudience: params.targetAudience ?? 'all',
      targetRoles: params.targetRoles ?? [],
      targetUsers: params.targetUsers ?? [],
      isPinned: params.isPinned ?? false,
      expiresAt: params.expiresAt ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AnnouncementProps & { id: string }): Announcement {
    return new Announcement(props.id, props);
  }

  updateDetails(params: Partial<{
    title: string;
    message: string;
    type: AnnouncementType;
    targetAudience: AnnouncementAudience;
    targetRoles: string[];
    targetUsers: string[];
    isPinned: boolean;
    expiresAt?: Date | null;
    isActive: boolean;
  }>): void {
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new Error('Announcement title cannot be empty');
      this._props.title = params.title.trim();
    }
    if (params.message !== undefined) {
      if (!params.message.trim()) throw new Error('Announcement message cannot be empty');
      this._props.message = params.message.trim();
    }
    if (params.type !== undefined) this._props.type = params.type;
    if (params.targetAudience !== undefined) this._props.targetAudience = params.targetAudience;
    if (params.targetRoles !== undefined) this._props.targetRoles = params.targetRoles;
    if (params.targetUsers !== undefined) this._props.targetUsers = params.targetUsers;
    if (params.isPinned !== undefined) this._props.isPinned = params.isPinned;
    if (params.expiresAt !== undefined) this._props.expiresAt = params.expiresAt;
    if (params.isActive !== undefined) this._props.isActive = params.isActive;
    this._props.updatedAt = new Date();
  }

  pin(): void {
    this._props.isPinned = true;
    this._props.updatedAt = new Date();
  }

  unpin(): void {
    this._props.isPinned = false;
    this._props.updatedAt = new Date();
  }

  deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  isApplicableTo(userId: string, userRoles: string[] = []): boolean {
    if (!this._props.isActive) return false;
    if (this._props.expiresAt && this._props.expiresAt.getTime() < Date.now()) return false;
    if (this._props.targetAudience === 'all') return true;
    if (this._props.targetAudience === 'specific' && this._props.targetUsers.includes(userId)) return true;
    if (this._props.targetAudience === 'role' && userRoles.some((r) => this._props.targetRoles.includes(r))) return true;
    return false;
  }

  get organizationId() { return this._props.organizationId; }
  get senderId() { return this._props.senderId; }
  get title() { return this._props.title; }
  get message() { return this._props.message; }
  get type() { return this._props.type; }
  get targetAudience() { return this._props.targetAudience; }
  get targetRoles() { return [...this._props.targetRoles]; }
  get targetUsers() { return [...this._props.targetUsers]; }
  get isPinned() { return this._props.isPinned; }
  get expiresAt() { return this._props.expiresAt; }
  get isActive() { return this._props.isActive; }
  get props() { return { ...this._props }; }
}

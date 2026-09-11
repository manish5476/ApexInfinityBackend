// ─────────────────────────────────────────────────────────────────────────────
//  AI Agent & Chat Communication — Domain Entities
//  Pure domain models — zero infrastructure imports.
// ─────────────────────────────────────────────────────────────────────────────

export type ChannelType = 'public' | 'private' | 'dm';

export interface ChannelProps {
  id: string;
  organizationId: string;
  name?: string;
  type: ChannelType;
  createdBy: string;
  members: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Channel {
  private readonly _props: ChannelProps;

  private constructor(props: ChannelProps) {
    this._props = { ...props };
  }

  static create(
    id: string,
    params: {
      organizationId: string;
      name?: string;
      type?: ChannelType;
      createdBy: string;
      members?: string[];
    },
    now = new Date(),
  ): Channel {
    const initialMembers = new Set(params.members ?? []);
    initialMembers.add(params.createdBy);

    return new Channel({
      id,
      organizationId: params.organizationId,
      name: params.name?.trim(),
      type: params.type ?? 'public',
      createdBy: params.createdBy,
      members: Array.from(initialMembers),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ChannelProps): Channel {
    return new Channel(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string { return this._props.organizationId; }
  get name(): string | undefined { return this._props.name; }
  get type(): ChannelType { return this._props.type; }
  get createdBy(): string { return this._props.createdBy; }
  get members(): string[] { return [...this._props.members]; }
  get isActive(): boolean { return this._props.isActive; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  addMember(userId: string): Channel {
    if (this._props.members.includes(userId)) return this;
    return new Channel({
      ...this._props,
      members: [...this._props.members, userId],
      updatedAt: new Date(),
    });
  }

  removeMember(userId: string): Channel {
    return new Channel({
      ...this._props,
      members: this._props.members.filter(m => m !== userId),
      updatedAt: new Date(),
    });
  }

  setActive(active: boolean): Channel {
    return new Channel({
      ...this._props,
      isActive: active,
      updatedAt: new Date(),
    });
  }

  toPersistence(): ChannelProps {
    return { ...this._props };
  }
}

export interface Attachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
  publicId?: string;
  assetId?: string;
}

export interface ChatMessageProps {
  id: string;
  organizationId: string;
  channelId: string;
  senderId: string;
  body?: string;
  attachments?: Attachment[];
  readBy: string[];
  deleted: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatMessage {
  private readonly _props: ChatMessageProps;

  private constructor(props: ChatMessageProps) {
    this._props = { ...props };
  }

  static create(
    id: string,
    params: {
      organizationId: string;
      channelId: string;
      senderId: string;
      body?: string;
      attachments?: Attachment[];
    },
    now = new Date(),
  ): ChatMessage {
    return new ChatMessage({
      id,
      organizationId: params.organizationId,
      channelId: params.channelId,
      senderId: params.senderId,
      body: params.body?.trim() ?? '',
      attachments: params.attachments ?? [],
      readBy: [params.senderId],
      deleted: false,
      editedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ChatMessageProps): ChatMessage {
    return new ChatMessage(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string { return this._props.organizationId; }
  get channelId(): string { return this._props.channelId; }
  get senderId(): string { return this._props.senderId; }
  get body(): string | undefined { return this._props.body; }
  get attachments(): Attachment[] | undefined { return this._props.attachments; }
  get readBy(): string[] { return [...this._props.readBy]; }
  get deleted(): boolean { return this._props.deleted; }
  get editedAt(): Date | null | undefined { return this._props.editedAt; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  edit(newBody: string, now = new Date()): ChatMessage {
    return new ChatMessage({
      ...this._props,
      body: newBody.trim(),
      editedAt: now,
      updatedAt: now,
    });
  }

  markDeleted(now = new Date()): ChatMessage {
    return new ChatMessage({
      ...this._props,
      body: 'This message was deleted',
      deleted: true,
      updatedAt: now,
    });
  }

  markReadBy(userId: string): ChatMessage {
    if (this._props.readBy.includes(userId)) return this;
    return new ChatMessage({
      ...this._props,
      readBy: [...this._props.readBy, userId],
      updatedAt: new Date(),
    });
  }

  toPersistence(): ChatMessageProps {
    return { ...this._props };
  }
}

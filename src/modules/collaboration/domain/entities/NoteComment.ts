import { Entity } from '../../../../core/domain/Entity';

export interface CommentReaction {
  emoji: string;
  users: string[];
}

export interface NoteCommentProps {
  organizationId: string;
  noteId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  reactions: CommentReaction[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NoteComment extends Entity<string> {
  private _props: NoteCommentProps;

  private constructor(id: string, props: NoteCommentProps) {
    super(id);
    this._props = props;
  }

  static create(params: {
    id: string;
    organizationId: string;
    noteId: string;
    authorId: string;
    content: string;
    parentId?: string | null;
  }): NoteComment {
    if (!params.content || !params.content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    const now = new Date();
    return new NoteComment(params.id, {
      organizationId: params.organizationId,
      noteId: params.noteId,
      authorId: params.authorId,
      content: params.content.trim(),
      parentId: params.parentId || null,
      reactions: [],
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: NoteCommentProps & { id: string }): NoteComment {
    return new NoteComment(props.id, props);
  }

  get props(): Readonly<NoteCommentProps> {
    return { ...this._props };
  }

  get organizationId(): string {
    return this._props.organizationId;
  }

  get noteId(): string {
    return this._props.noteId;
  }

  get authorId(): string {
    return this._props.authorId;
  }

  get content(): string {
    return this._props.content;
  }

  get parentId(): string | null {
    return this._props.parentId || null;
  }

  get reactions(): ReadonlyArray<CommentReaction> {
    return [...this._props.reactions];
  }

  updateContent(content: string): void {
    if (!content || !content.trim()) throw new Error('Comment content cannot be empty');
    this._props.content = content.trim();
    this._props.isEdited = true;
    this._props.updatedAt = new Date();
  }

  toggleReaction(emoji: string, userId: string): void {
    let reaction = this._props.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [userId] };
      this._props.reactions.push(reaction);
    } else {
      if (reaction.users.includes(userId)) {
        reaction.users = reaction.users.filter((u) => u !== userId);
        if (reaction.users.length === 0) {
          this._props.reactions = this._props.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        reaction.users.push(userId);
      }
    }
    this._props.updatedAt = new Date();
  }
}

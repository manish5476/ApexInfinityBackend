import { Entity } from '../../../../core/domain/Entity';
import { NoteItemType } from './Note';

export interface TemplateChecklistItem {
  title: string;
  order: number;
}

export interface NoteTemplateProps {
  organizationId: string;
  name: string;
  description?: string | null;
  itemType: NoteItemType;
  content: string;
  checklists: TemplateChecklistItem[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class NoteTemplate extends Entity<string> {
  private _props: NoteTemplateProps;

  private constructor(id: string, props: NoteTemplateProps) {
    super(id);
    this._props = props;
  }

  static create(params: {
    id: string;
    organizationId: string;
    name: string;
    description?: string | null;
    itemType?: NoteItemType;
    content?: string;
    checklists?: TemplateChecklistItem[];
    tags?: string[];
    isPublic?: boolean;
    createdBy: string;
  }): NoteTemplate {
    if (!params.name || !params.name.trim()) {
      throw new Error('Template name cannot be empty');
    }

    const now = new Date();
    return new NoteTemplate(params.id, {
      organizationId: params.organizationId,
      name: params.name.trim(),
      description: params.description || null,
      itemType: params.itemType || 'note',
      content: params.content || '',
      checklists: params.checklists || [],
      tags: params.tags || [],
      isPublic: params.isPublic !== undefined ? params.isPublic : true,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: NoteTemplateProps & { id: string }): NoteTemplate {
    return new NoteTemplate(props.id, props);
  }

  get props(): Readonly<NoteTemplateProps> {
    return { ...this._props };
  }

  get organizationId(): string {
    return this._props.organizationId;
  }

  get name(): string {
    return this._props.name;
  }

  get itemType(): NoteItemType {
    return this._props.itemType;
  }

  get content(): string {
    return this._props.content;
  }

  get description(): string | null | undefined {
    return this._props.description;
  }

  get isPublic(): boolean {
    return this._props.isPublic;
  }

  get tags(): ReadonlyArray<string> {
    return [...this._props.tags];
  }

  get checklists(): ReadonlyArray<TemplateChecklistItem> {
    return [...this._props.checklists];
  }

  updateDetails(params: Partial<{
    name: string;
    description: string | null;
    itemType: NoteItemType;
    content: string;
    checklists: TemplateChecklistItem[];
    tags: string[];
    isPublic: boolean;
  }>): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Template name cannot be empty');
      this._props.name = params.name.trim();
    }
    if (params.description !== undefined) this._props.description = params.description;
    if (params.itemType !== undefined) this._props.itemType = params.itemType;
    if (params.content !== undefined) this._props.content = params.content;
    if (params.checklists !== undefined) this._props.checklists = params.checklists;
    if (params.tags !== undefined) this._props.tags = params.tags;
    if (params.isPublic !== undefined) this._props.isPublic = params.isPublic;
    this._props.updatedAt = new Date();
  }
}

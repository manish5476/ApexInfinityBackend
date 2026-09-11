import { AggregateRoot } from '../../../../core/domain/AggregateRoot';

export interface MasterItemMetadata {
  isFeatured?: boolean;
  sortOrder?: number;
  [key: string]: unknown;
}

export interface MasterItemProps {
  organizationId: string;
  type: string;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  metadata: MasterItemMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMasterItemParams {
  id: string;
  organizationId: string;
  type: string;
  name: string;
  slug?: string;
  code?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  metadata?: MasterItemMetadata;
}

export class MasterItem extends AggregateRoot<string> {
  private _props: MasterItemProps;

  private constructor(id: string, props: MasterItemProps) {
    super(id);
    this._props = props;
  }

  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static create(params: CreateMasterItemParams): MasterItem {
    if (!params.type || !params.type.trim()) {
      throw new Error('Master type is required');
    }
    if (!params.name || !params.name.trim()) {
      throw new Error('Master name is required');
    }

    const trimmedName = params.name.trim();
    const slug = params.slug?.trim() || `${MasterItem.slugify(trimmedName)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();

    return new MasterItem(params.id, {
      organizationId: params.organizationId,
      type: params.type.toLowerCase().trim(),
      name: trimmedName,
      slug,
      code: params.code ? params.code.trim().toUpperCase() : null,
      description: params.description?.trim() || null,
      imageUrl: params.imageUrl?.trim() || null,
      parentId: params.parentId || null,
      isActive: params.isActive !== undefined ? params.isActive : true,
      metadata: {
        isFeatured: params.metadata?.isFeatured ?? false,
        sortOrder: params.metadata?.sortOrder ?? 0,
        ...(params.metadata || {}),
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MasterItemProps & { id: string }): MasterItem {
    return new MasterItem(props.id, props);
  }

  updateDetails(params: Partial<{
    name: string;
    type: string;
    code?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    parentId?: string | null;
    isActive?: boolean;
    metadata?: MasterItemMetadata;
  }>): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Master name cannot be empty');
      this._props.name = params.name.trim();
    }
    if (params.type !== undefined) {
      if (!params.type.trim()) throw new Error('Master type cannot be empty');
      this._props.type = params.type.toLowerCase().trim();
    }
    if (params.code !== undefined) {
      this._props.code = params.code ? params.code.trim().toUpperCase() : null;
    }
    if (params.description !== undefined) {
      this._props.description = params.description ? params.description.trim() : null;
    }
    if (params.imageUrl !== undefined) {
      this._props.imageUrl = params.imageUrl ? params.imageUrl.trim() : null;
    }
    if (params.parentId !== undefined) {
      this._props.parentId = params.parentId || null;
    }
    if (params.isActive !== undefined) {
      this._props.isActive = params.isActive;
    }
    if (params.metadata !== undefined) {
      this._props.metadata = {
        ...this._props.metadata,
        ...params.metadata,
      };
    }
    this._props.updatedAt = new Date();
  }

  deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  activate(): void {
    this._props.isActive = true;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get type() { return this._props.type; }
  get name() { return this._props.name; }
  get slug() { return this._props.slug; }
  get code() { return this._props.code; }
  get description() { return this._props.description; }
  get imageUrl() { return this._props.imageUrl; }
  get parentId() { return this._props.parentId; }
  get isActive() { return this._props.isActive; }
  get metadata() { return this._props.metadata; }
  get createdAt() { return this._props.createdAt; }
  get updatedAt() { return this._props.updatedAt; }
  get props() { return { ...this._props, id: this.id }; }
}

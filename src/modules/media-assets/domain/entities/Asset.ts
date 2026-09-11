// ─────────────────────────────────────────────────────────────────────────────
//  Asset — Media & Assets Domain Entity
//  Pure domain model — zero infrastructure imports.
// ─────────────────────────────────────────────────────────────────────────────

export type AssetCategory = 'product' | 'avatar' | 'invoice' | 'chat' | 'marketing';
export type StorageProvider = 'cloudinary' | 'local';

export interface AssetProps {
  id: string;
  organizationId: string;
  uploadedBy: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size: number; // in bytes
  publicId: string;
  url: string;
  category: AssetCategory;
  provider: StorageProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetParams {
  organizationId: string;
  uploadedBy: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size: number;
  publicId: string;
  url: string;
  category?: AssetCategory;
  provider?: StorageProvider;
}

export class Asset {
  private readonly _props: AssetProps;

  private constructor(props: AssetProps) {
    this._props = { ...props };
  }

  static create(id: string, params: CreateAssetParams, now = new Date()): Asset {
    return new Asset({
      id,
      organizationId: params.organizationId,
      uploadedBy: params.uploadedBy,
      fileName: params.fileName.trim(),
      originalName: params.originalName || params.fileName,
      mimeType: params.mimeType || 'application/octet-stream',
      size: Math.max(0, params.size),
      publicId: params.publicId,
      url: params.url,
      category: params.category ?? 'marketing',
      provider: params.provider ?? 'cloudinary',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: AssetProps): Asset {
    return new Asset(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string { return this._props.organizationId; }
  get uploadedBy(): string { return this._props.uploadedBy; }
  get fileName(): string { return this._props.fileName; }
  get originalName(): string | undefined { return this._props.originalName; }
  get mimeType(): string | undefined { return this._props.mimeType; }
  get size(): number { return this._props.size; }
  get publicId(): string { return this._props.publicId; }
  get url(): string { return this._props.url; }
  get category(): AssetCategory { return this._props.category; }
  get provider(): StorageProvider { return this._props.provider; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  get sizeInMb(): number {
    return Number((this._props.size / (1024 * 1024)).toFixed(2));
  }

  toPersistence(): AssetProps {
    return { ...this._props };
  }
}

import { randomUUID } from 'crypto';
import { Asset, AssetCategory, StorageProvider } from '../../domain/entities/Asset';
import {
  IAssetRepository,
  AssetListQuery,
  AssetListResult,
  StorageStatsResult,
} from '../../domain/ports/IAssetRepository';
import { IStorageProvider } from '../../domain/ports/IStorageProvider';

export interface UploadAssetInput {
  organizationId: string;
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  category?: AssetCategory;
  provider?: StorageProvider;
}

export class AssetUseCases {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadAsset(input: UploadAssetInput): Promise<Asset> {
    if (!input.fileBuffer || input.fileBuffer.length === 0) {
      throw new Error('No file provided for upload.');
    }

    const category = input.category ?? 'marketing';
    const folder = `apex/${input.organizationId}/${category}`;

    // 1. Upload to storage provider
    const cloudResult = await this.storageProvider.uploadFile(
      input.fileBuffer,
      folder,
      'auto',
    );

    // 2. Create domain entity
    const id = randomUUID();
    const asset = Asset.create(id, {
      organizationId: input.organizationId,
      uploadedBy: input.userId,
      fileName: input.fileName,
      originalName: input.originalName ?? input.fileName,
      mimeType: input.mimeType ?? 'application/octet-stream',
      size: cloudResult.bytes,
      publicId: cloudResult.publicId,
      url: cloudResult.url,
      category,
      provider: input.provider ?? 'cloudinary',
    });

    // 3. Save to database
    return this.assetRepo.save(asset);
  }

  async uploadMultipleAssets(
    files: Array<{ buffer: Buffer; fileName: string; originalName?: string; mimeType?: string }>,
    organizationId: string,
    userId: string,
    category: AssetCategory = 'product',
  ): Promise<Asset[]> {
    if (!files || files.length === 0) {
      throw new Error('No files provided for multiple upload.');
    }

    return Promise.all(
      files.map(f =>
        this.uploadAsset({
          organizationId,
          userId,
          fileBuffer: f.buffer,
          fileName: f.fileName,
          originalName: f.originalName,
          mimeType: f.mimeType,
          category,
        }),
      ),
    );
  }

  async getAssets(orgId: string, query: AssetListQuery): Promise<AssetListResult> {
    return this.assetRepo.findAll(orgId, query);
  }

  async getAssetById(orgId: string, id: string): Promise<Asset> {
    const asset = await this.assetRepo.findById(orgId, id);
    if (!asset) {
      throw new Error(`Asset not found: ${id}`);
    }
    return asset;
  }

  async deleteAsset(orgId: string, id: string): Promise<boolean> {
    const asset = await this.assetRepo.findById(orgId, id);
    if (!asset) {
      throw new Error('Asset not found or unauthorized.');
    }

    // 1. Delete from storage provider
    const storageDeleted = await this.storageProvider.deleteFile(asset.publicId);
    if (!storageDeleted) {
      // In case storage provider deletion fails, maintain DB record or warn
      // In mock/in-memory it always succeeds
    }

    // 2. Delete from database
    return this.assetRepo.delete(orgId, id);
  }

  async getStorageStats(orgId: string): Promise<StorageStatsResult> {
    return this.assetRepo.getStorageStats(orgId);
  }
}

import mongoose from 'mongoose';
import { Asset, AssetProps, AssetCategory, StorageProvider } from '../../domain/entities/Asset';
import {
  IAssetRepository,
  AssetListQuery,
  AssetListResult,
  StorageStatsResult,
} from '../../domain/ports/IAssetRepository';
import { AssetModel, AssetDoc } from '../persistence/asset.model';

function toEntity(doc: AssetDoc): Asset {
  const props: AssetProps = {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    uploadedBy: doc.uploadedBy.toString(),
    fileName: doc.fileName,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    publicId: doc.publicId,
    url: doc.url,
    category: doc.category as AssetCategory,
    provider: doc.provider as StorageProvider,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return Asset.fromPersistence(props);
}

function toDoc(asset: Asset): Record<string, unknown> {
  const p = asset.toPersistence();
  return {
    organizationId: p.organizationId,
    uploadedBy: p.uploadedBy,
    fileName: p.fileName,
    originalName: p.originalName,
    mimeType: p.mimeType,
    size: p.size,
    publicId: p.publicId,
    url: p.url,
    category: p.category,
    provider: p.provider,
  };
}

export class MongoAssetRepository implements IAssetRepository {
  async save(asset: Asset): Promise<Asset> {
    const doc = await AssetModel.create(toDoc(asset));
    return toEntity(doc);
  }

  async saveMany(assets: Asset[]): Promise<Asset[]> {
    const docs = await AssetModel.insertMany(assets.map(toDoc));
    return (docs as unknown as AssetDoc[]).map(toEntity);
  }

  async findById(orgId: string, id: string): Promise<Asset | null> {
    const doc = await AssetModel.findOne({
      _id: id,
      organizationId: orgId,
    }).lean<AssetDoc>();
    if (!doc) return null;
    return toEntity(doc as AssetDoc);
  }

  async findAll(orgId: string, query: AssetListQuery): Promise<AssetListResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { organizationId: orgId };
    if (query.category) filter['category'] = query.category;
    if (query.search) filter['fileName'] = { $regex: query.search, $options: 'i' };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      AssetModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email')
        .lean<AssetDoc[]>(),
      AssetModel.countDocuments(filter),
    ]);

    return {
      data: (docs as AssetDoc[]).map(toEntity),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const result = await AssetModel.deleteOne({ _id: id, organizationId: orgId });
    return result.deletedCount === 1;
  }

  async getStorageStats(orgId: string): Promise<StorageStatsResult> {
    const stats = await AssetModel.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalBytes: { $sum: '$size' },
                totalFiles: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                bytes: { $sum: '$size' },
                count: { $sum: 1 },
              },
            },
            { $sort: { bytes: -1 } },
          ],
        },
      },
    ]);

    const overallStats = stats[0]?.overall[0] || { totalBytes: 0, totalFiles: 0 };
    const categoryStats = stats[0]?.byCategory || [];

    return {
      totalBytes: overallStats.totalBytes,
      totalFiles: overallStats.totalFiles,
      totalMB: (overallStats.totalBytes / (1024 * 1024)).toFixed(2),
      breakdown: categoryStats.map((cat: { _id: string; count: number; bytes: number }) => ({
        category: cat._id,
        count: cat.count,
        bytes: cat.bytes,
        mb: (cat.bytes / (1024 * 1024)).toFixed(2),
      })),
    };
  }
}

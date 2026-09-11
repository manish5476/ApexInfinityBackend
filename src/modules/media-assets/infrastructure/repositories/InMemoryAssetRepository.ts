import { Asset, AssetProps } from '../../domain/entities/Asset';
import {
  IAssetRepository,
  AssetListQuery,
  AssetListResult,
  StorageStatsResult,
} from '../../domain/ports/IAssetRepository';

export class InMemoryAssetRepository implements IAssetRepository {
  private store = new Map<string, AssetProps>();

  async save(asset: Asset): Promise<Asset> {
    this.store.set(asset.id, asset.toPersistence());
    return asset;
  }

  async saveMany(assets: Asset[]): Promise<Asset[]> {
    for (const a of assets) {
      this.store.set(a.id, a.toPersistence());
    }
    return assets;
  }

  async findById(orgId: string, id: string): Promise<Asset | null> {
    const props = this.store.get(id);
    if (!props || props.organizationId !== orgId) return null;
    return Asset.fromPersistence(props);
  }

  async findAll(orgId: string, query: AssetListQuery): Promise<AssetListResult> {
    let items = Array.from(this.store.values()).filter(p => p.organizationId === orgId);

    if (query.category) {
      items = items.filter(p => p.category === query.category);
    }

    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter(p => p.fileName.toLowerCase().includes(term));
    }

    // Sort
    const sortField = (query.sortBy ?? 'createdAt') as keyof AssetProps;
    const sortAsc = query.sortOrder === 'asc';
    items.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: items.slice(start, start + limit).map(p => Asset.fromPersistence(p)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    return this.store.delete(id);
  }

  async getStorageStats(orgId: string): Promise<StorageStatsResult> {
    const items = Array.from(this.store.values()).filter(p => p.organizationId === orgId);

    let totalBytes = 0;
    const catMap = new Map<string, { count: number; bytes: number }>();

    for (const item of items) {
      totalBytes += item.size;
      const current = catMap.get(item.category) ?? { count: 0, bytes: 0 };
      catMap.set(item.category, {
        count: current.count + 1,
        bytes: current.bytes + item.size,
      });
    }

    const breakdown = Array.from(catMap.entries()).map(([cat, stats]) => ({
      category: cat,
      count: stats.count,
      bytes: stats.bytes,
      mb: (stats.bytes / (1024 * 1024)).toFixed(2),
    }));

    // Sort breakdown by bytes desc
    breakdown.sort((a, b) => b.bytes - a.bytes);

    return {
      totalBytes,
      totalFiles: items.length,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
      breakdown,
    };
  }
}

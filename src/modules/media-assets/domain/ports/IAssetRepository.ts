import { Asset, AssetCategory } from '../entities/Asset';

export interface AssetListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: AssetCategory;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssetListResult {
  data: Asset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CategoryStorageStats {
  category: string;
  count: number;
  bytes: number;
  mb: string;
}

export interface StorageStatsResult {
  totalBytes: number;
  totalFiles: number;
  totalMB: string;
  breakdown: CategoryStorageStats[];
}

export interface IAssetRepository {
  save(asset: Asset): Promise<Asset>;
  saveMany(assets: Asset[]): Promise<Asset[]>;
  findById(orgId: string, id: string): Promise<Asset | null>;
  findAll(orgId: string, query: AssetListQuery): Promise<AssetListResult>;
  delete(orgId: string, id: string): Promise<boolean>;
  getStorageStats(orgId: string): Promise<StorageStatsResult>;
}

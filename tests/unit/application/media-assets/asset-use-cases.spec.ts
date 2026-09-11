import { AssetUseCases } from '../../../../src/modules/media-assets/application/use-cases/AssetUseCases';
import { InMemoryAssetRepository } from '../../../../src/modules/media-assets/infrastructure/repositories/InMemoryAssetRepository';
import { InMemoryStorageProvider } from '../../../../src/modules/media-assets/infrastructure/storage/InMemoryStorageProvider';
import { Asset } from '../../../../src/modules/media-assets/domain/entities/Asset';

describe('Media & Assets Module', () => {
  let repo: InMemoryAssetRepository;
  let storage: InMemoryStorageProvider;
  let useCases: AssetUseCases;

  const orgId = 'org-test-123';
  const userId = 'user-test-456';

  beforeEach(() => {
    repo = new InMemoryAssetRepository();
    storage = new InMemoryStorageProvider();
    useCases = new AssetUseCases(repo, storage);
  });

  describe('Asset Entity', () => {
    it('creates an asset with valid default values and calculates MB size correctly', () => {
      const asset = Asset.create('a1', {
        organizationId: orgId,
        uploadedBy: userId,
        fileName: ' invoice_october.pdf ',
        size: 2 * 1024 * 1024, // 2MB
        publicId: 'apex/org/invoice_1',
        url: 'https://cloudinary.com/apex/org/invoice_1.pdf',
        category: 'invoice',
      });

      expect(asset.id).toBe('a1');
      expect(asset.fileName).toBe('invoice_october.pdf');
      expect(asset.category).toBe('invoice');
      expect(asset.provider).toBe('cloudinary');
      expect(asset.sizeInMb).toBe(2);
    });
  });

  describe('AssetUseCases.uploadAsset', () => {
    it('uploads a file buffer to storage and saves asset record in repository', async () => {
      const buffer = Buffer.from('hello world image data');
      const asset = await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: buffer,
        fileName: 'profile.png',
        mimeType: 'image/png',
        category: 'avatar',
      });

      expect(asset.id).toBeDefined();
      expect(asset.fileName).toBe('profile.png');
      expect(asset.category).toBe('avatar');
      expect(asset.size).toBe(buffer.length);
      expect(asset.url).toContain('.png');
      expect(storage.hasFile(asset.publicId)).toBe(true);

      const retrieved = await repo.findById(orgId, asset.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(asset.id);
    });

    it('throws an error if file buffer is empty or missing', async () => {
      await expect(
        useCases.uploadAsset({
          organizationId: orgId,
          userId,
          fileBuffer: Buffer.alloc(0),
          fileName: 'empty.png',
        }),
      ).rejects.toThrow('No file provided for upload.');
    });
  });

  describe('AssetUseCases.uploadMultipleAssets', () => {
    it('uploads multiple files in parallel and records them', async () => {
      const files = [
        { buffer: Buffer.from('file1'), fileName: 'prod1.jpg', mimeType: 'image/jpeg' },
        { buffer: Buffer.from('file22'), fileName: 'prod2.jpg', mimeType: 'image/jpeg' },
        { buffer: Buffer.from('file333'), fileName: 'prod3.jpg', mimeType: 'image/jpeg' },
      ];

      const assets = await useCases.uploadMultipleAssets(files, orgId, userId, 'product');

      expect(assets).toHaveLength(3);
      expect(assets[0]!.category).toBe('product');
      expect(assets[1]!.category).toBe('product');
      expect(assets[2]!.category).toBe('product');

      const stats = await useCases.getStorageStats(orgId);
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalBytes).toBe(files[0]!.buffer.length + files[1]!.buffer.length + files[2]!.buffer.length);
    });
  });

  describe('AssetUseCases.getAssets', () => {
    beforeEach(async () => {
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('alpha'),
        fileName: 'alpha_banner.png',
        category: 'marketing',
      });
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('beta'),
        fileName: 'beta_product.png',
        category: 'product',
      });
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('gamma'),
        fileName: 'gamma_invoice.pdf',
        category: 'invoice',
      });
    });

    it('lists all assets with pagination metadata', async () => {
      const result = await useCases.getAssets(orgId, { page: 1, limit: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.pages).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('filters assets by category', async () => {
      const result = await useCases.getAssets(orgId, { category: 'product' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.fileName).toBe('beta_product.png');
    });

    it('searches assets by file name', async () => {
      const result = await useCases.getAssets(orgId, { search: 'invoice' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.fileName).toBe('gamma_invoice.pdf');
    });
  });

  describe('AssetUseCases.getStorageStats', () => {
    it('aggregates total bytes, file count, and category breakdown', async () => {
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('a'.repeat(1024)), // 1KB
        fileName: 'file1.jpg',
        category: 'product',
      });
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('b'.repeat(2048)), // 2KB
        fileName: 'file2.jpg',
        category: 'product',
      });
      await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('c'.repeat(512)), // 0.5KB
        fileName: 'avatar.jpg',
        category: 'avatar',
      });

      const stats = await useCases.getStorageStats(orgId);
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalBytes).toBe(1024 + 2048 + 512);

      const productCat = stats.breakdown.find(c => c.category === 'product');
      expect(productCat).toBeDefined();
      expect(productCat?.count).toBe(2);
      expect(productCat?.bytes).toBe(3072);

      const avatarCat = stats.breakdown.find(c => c.category === 'avatar');
      expect(avatarCat).toBeDefined();
      expect(avatarCat?.count).toBe(1);
      expect(avatarCat?.bytes).toBe(512);
    });
  });

  describe('AssetUseCases.deleteAsset', () => {
    it('deletes the asset from both storage and database', async () => {
      const asset = await useCases.uploadAsset({
        organizationId: orgId,
        userId,
        fileBuffer: Buffer.from('temp'),
        fileName: 'temp.jpg',
        category: 'marketing',
      });

      expect(storage.hasFile(asset.publicId)).toBe(true);
      const deleted = await useCases.deleteAsset(orgId, asset.id);
      expect(deleted).toBe(true);
      expect(storage.hasFile(asset.publicId)).toBe(false);

      const check = await repo.findById(orgId, asset.id);
      expect(check).toBeNull();
    });

    it('throws error when attempting to delete non-existent asset', async () => {
      await expect(useCases.deleteAsset(orgId, 'non-existent-id')).rejects.toThrow(
        'Asset not found or unauthorized.',
      );
    });
  });
});

import { Request, Response, NextFunction } from 'express';
import { AssetUseCases } from '../../application/use-cases/AssetUseCases';
import { AssetCategory } from '../../domain/entities/Asset';
import { queryAssetsSchema, uploadAssetSchema } from '../validation/asset.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getContext(req: Request): { organizationId: string; userId: string } {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  const organizationId =
    ctx?.organizationId ||
    user?.organizationId ||
    (req.headers['x-organization-id'] as string) ||
    '';
  const userId = ctx?.userId || user?._id || user?.id || 'system';
  return { organizationId, userId };
}

function param(req: Request, name: string): string {
  return (req.params[name] as string) || '';
}

export class AssetController {
  constructor(private readonly useCases: AssetUseCases) {}

  getAllAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const query = queryAssetsSchema.parse(req.query);

      const result = await this.useCases.getAssets(organizationId, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: query.category as AssetCategory | undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        total: result.pagination.total,
        totalPages: result.pagination.pages,
        currentPage: result.pagination.page,
        data: {
          assets: result.data.map(a => a.toPersistence()),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getStorageStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const stats = await this.useCases.getStorageStats(organizationId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  uploadAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = uploadAssetSchema.parse(req.body);
      const file = req.file;

      if (!file) {
        res.status(400).json({
          status: 'fail',
          message: 'No file provided for upload.',
        });
        return;
      }

      const asset = await this.useCases.uploadAsset({
        organizationId,
        userId,
        fileBuffer: file.buffer,
        fileName: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        category: body.category as AssetCategory,
      });

      res.status(201).json({
        status: 'success',
        data: {
          asset: asset.toPersistence(),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  uploadMultipleAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = uploadAssetSchema.parse(req.body);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          status: 'fail',
          message: 'No files provided for multiple upload.',
        });
        return;
      }

      const mappedFiles = files.map(f => ({
        buffer: f.buffer,
        fileName: f.originalname,
        originalName: f.originalname,
        mimeType: f.mimetype,
      }));

      const assets = await this.useCases.uploadMultipleAssets(
        mappedFiles,
        organizationId,
        userId,
        body.category as AssetCategory,
      );

      res.status(201).json({
        status: 'success',
        results: assets.length,
        data: {
          assets: assets.map(a => a.toPersistence()),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const asset = await this.useCases.getAssetById(organizationId, param(req, 'id'));

      res.status(200).json({
        status: 'success',
        data: {
          asset: asset.toPersistence(),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  deleteAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      await this.useCases.deleteAsset(organizationId, param(req, 'id'));

      res.status(200).json({
        status: 'success',
        message: 'Asset permanently removed from Cloudinary and Database.',
      });
    } catch (err) {
      next(err);
    }
  };
}

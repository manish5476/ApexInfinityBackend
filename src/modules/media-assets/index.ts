import { Router } from 'express';
import { Connection } from 'mongoose';
import { IAssetRepository } from './domain/ports/IAssetRepository';
import { IStorageProvider } from './domain/ports/IStorageProvider';
import { InMemoryAssetRepository } from './infrastructure/repositories/InMemoryAssetRepository';
import { MongoAssetRepository } from './infrastructure/repositories/MongoAssetRepository';
import { InMemoryStorageProvider } from './infrastructure/storage/InMemoryStorageProvider';
import { CloudinaryStorageProvider } from './infrastructure/storage/CloudinaryStorageProvider';
import { AssetUseCases } from './application/use-cases/AssetUseCases';
import { AssetController } from './presentation/controllers/asset.controller';
import { createAssetRouter } from './presentation/routes/asset.routes';

export interface MediaAssetsModule {
  router: Router;
  repository: IAssetRepository;
  storageProvider: IStorageProvider;
  useCases: AssetUseCases;
  controller: AssetController;
}

export function createMediaAssetsModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): MediaAssetsModule {
  const repository: IAssetRepository = deps.useInMemory
    ? new InMemoryAssetRepository()
    : new MongoAssetRepository();

  const storageProvider: IStorageProvider = deps.useInMemory
    ? new InMemoryStorageProvider()
    : (process.env.CLOUDINARY_CLOUD_NAME
        ? new CloudinaryStorageProvider()
        : new InMemoryStorageProvider());

  const useCases = new AssetUseCases(repository, storageProvider);
  const controller = new AssetController(useCases);
  const router = createAssetRouter(controller);

  return {
    router,
    repository,
    storageProvider,
    useCases,
    controller,
  };
}

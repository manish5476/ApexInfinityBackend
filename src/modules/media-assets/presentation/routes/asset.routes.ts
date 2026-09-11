import { Router } from 'express';
import multer from 'multer';
import { AssetController } from '../controllers/asset.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

export function createAssetRouter(ctrl: AssetController): Router {
  const router = Router();

  // Storage Stats (before /:id to prevent param capture)
  router.get('/stats', ctrl.getStorageStats);

  // Upload routes
  router.post('/upload', upload.single('file'), ctrl.uploadAsset);
  router.post('/upload/multiple', upload.array('files', 10), ctrl.uploadMultipleAssets);

  // CRUD
  router.route('/')
    .get(ctrl.getAllAssets);

  router.route('/:id')
    .get(ctrl.getAsset)
    .delete(ctrl.deleteAsset);

  return router;
}

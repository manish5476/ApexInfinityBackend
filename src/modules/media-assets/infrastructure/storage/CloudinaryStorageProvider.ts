import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const streamifier = require('streamifier');
import { IStorageProvider, UploadResult } from '../../domain/ports/IStorageProvider';

export class CloudinaryStorageProvider implements IStorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    folder = 'uploads',
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      if (!fileBuffer || fileBuffer.length === 0) {
        return reject(new Error('No file buffer provided'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(new Error(`Failed to upload file to Cloudinary: ${error?.message || 'Unknown error'}`));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    if (!publicId) throw new Error('No public_id provided for deletion');
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete file from Cloudinary: ${msg}`);
    }
  }
}

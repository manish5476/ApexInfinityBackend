export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format?: string;
}

export interface IStorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    folder: string,
    resourceType?: 'image' | 'video' | 'raw' | 'auto',
  ): Promise<UploadResult>;

  deleteFile(publicId: string): Promise<boolean>;
}

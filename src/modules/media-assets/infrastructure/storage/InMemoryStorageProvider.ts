import { IStorageProvider, UploadResult } from '../../domain/ports/IStorageProvider';

let fileCounter = 0;

export class InMemoryStorageProvider implements IStorageProvider {
  private files = new Map<string, { buffer: Buffer; meta: UploadResult }>();

  async uploadFile(
    fileBuffer: Buffer,
    folder: string,
    _resourceType?: 'image' | 'video' | 'raw' | 'auto',
  ): Promise<UploadResult> {
    fileCounter++;
    const publicId = `${folder}/mock_asset_${fileCounter}_${Date.now()}`;
    const url = `https://mock-storage.apex.local/${publicId}.png`;
    const result: UploadResult = {
      url,
      publicId,
      bytes: fileBuffer.length,
      format: 'png',
    };
    this.files.set(publicId, { buffer: fileBuffer, meta: result });
    return result;
  }

  async deleteFile(publicId: string): Promise<boolean> {
    return this.files.delete(publicId);
  }

  // Helper for test assertions
  hasFile(publicId: string): boolean {
    return this.files.has(publicId);
  }
}

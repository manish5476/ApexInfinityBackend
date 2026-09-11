import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { NotFoundError } from '../../../../shared/errors';

export class DeleteNotificationUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async executeDeleteOne(params: { id: string; organizationId: string; recipientId?: string }): Promise<void> {
    const deleted = await this.repo.delete(params);
    if (!deleted) {
      throw new NotFoundError('Notification', params.id);
    }
  }

  async executeClearAll(params: { organizationId: string; recipientId: string }): Promise<number> {
    return this.repo.clearAll(params.organizationId, params.recipientId);
  }
}

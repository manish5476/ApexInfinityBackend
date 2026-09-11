import { INotificationRepository } from '../../domain/ports/INotificationRepository';

export class GetUnreadCountUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(params: { organizationId: string; recipientId: string }): Promise<number> {
    return this.repo.getUnreadCount(params.organizationId, params.recipientId);
  }
}

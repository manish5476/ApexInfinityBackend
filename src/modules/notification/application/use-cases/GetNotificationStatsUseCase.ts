import { INotificationRepository, NotificationStats } from '../../domain/ports/INotificationRepository';

export class GetNotificationStatsUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(params: { organizationId: string; recipientId: string }): Promise<NotificationStats> {
    return this.repo.getStats(params.organizationId, params.recipientId);
  }
}

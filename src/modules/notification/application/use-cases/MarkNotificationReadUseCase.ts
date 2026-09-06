import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(params: { notificationId: string }, context: { organizationId: string }): Promise<Notification> {
    const notification = await this.notificationRepo.findById({
      id: params.notificationId,
      organizationId: context.organizationId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);

    return notification;
  }
}

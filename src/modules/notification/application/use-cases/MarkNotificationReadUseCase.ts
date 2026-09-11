import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { NotFoundError } from '../../../../shared/errors';

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(params: { notificationId: string }, context: { organizationId: string; recipientId?: string }): Promise<Notification> {
    const notification = await this.notificationRepo.findById({
      id: params.notificationId,
      organizationId: context.organizationId,
      recipientId: context.recipientId,
    });

    if (!notification) {
      throw new NotFoundError('Notification', params.notificationId);
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);

    return notification;
  }

  async executeMultiple(params: { notificationIds: string[] }, context: { organizationId: string; recipientId: string }): Promise<number> {
    return this.notificationRepo.markMultipleAsRead(context.organizationId, context.recipientId, params.notificationIds);
  }

  async executeAll(context: { organizationId: string; recipientId: string }): Promise<number> {
    return this.notificationRepo.markAllAsRead(context.organizationId, context.recipientId);
  }
}

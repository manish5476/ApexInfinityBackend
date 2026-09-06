import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType, NotificationPriority, NotificationBusinessType } from '../../domain/value-objects/NotificationEnums';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { randomUUID } from 'crypto';

export interface SendNotificationDto {
  recipientId: string;
  title: string;
  message: string;
  businessType?: NotificationBusinessType;
  type?: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(dto: SendNotificationDto, context: { organizationId: string }): Promise<Notification> {
    const notification = Notification.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      ...dto,
    });

    await this.notificationRepo.save(notification);

    for (const event of notification.domainEvents) {
      await this.eventBus.publishDomainEvent(event);
    }
    notification.clearDomainEvents();

    return notification;
  }
}

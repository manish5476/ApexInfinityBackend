import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';

export interface ListNotificationsDto {
  recipientId?: string;
  isRead?: boolean;
  type?: string;
  businessType?: string;
  page?: number;
  limit?: number;
}

export class ListNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(
    dto: ListNotificationsDto,
    context: { organizationId: string; userId?: string }
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const recipientId = dto.recipientId || context.userId;

    return this.notificationRepo.list({
      organizationId: context.organizationId,
      recipientId,
      isRead: dto.isRead,
      type: dto.type,
      businessType: dto.businessType,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    });
  }
}

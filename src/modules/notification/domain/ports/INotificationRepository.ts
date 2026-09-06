import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  findById(query: { id: string; organizationId: string }): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  list(query: {
    organizationId: string;
    recipientId?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Notification[]; total: number; unreadCount: number }>;
}

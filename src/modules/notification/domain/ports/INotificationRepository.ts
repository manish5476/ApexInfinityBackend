import { Notification } from '../entities/Notification';

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, { total: number; unread: number }>;
}

export interface INotificationRepository {
  findById(query: { id: string; organizationId: string; recipientId?: string }): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  saveMany(notifications: Notification[]): Promise<void>;
  list(query: {
    organizationId: string;
    recipientId?: string;
    isRead?: boolean;
    type?: string;
    businessType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Notification[]; total: number; unreadCount: number }>;
  getUnreadCount(organizationId: string, recipientId: string): Promise<number>;
  getStats(organizationId: string, recipientId: string): Promise<NotificationStats>;
  markMultipleAsRead(organizationId: string, recipientId: string, notificationIds: string[]): Promise<number>;
  markAllAsRead(organizationId: string, recipientId: string): Promise<number>;
  delete(query: { id: string; organizationId: string; recipientId?: string }): Promise<boolean>;
  clearAll(organizationId: string, recipientId: string): Promise<number>;
}

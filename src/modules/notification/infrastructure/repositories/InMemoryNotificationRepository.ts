import { INotificationRepository, NotificationStats } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';

export class InMemoryNotificationRepository implements INotificationRepository {
  public notifications: Notification[] = [];

  async findById(query: { id: string; organizationId: string; recipientId?: string }): Promise<Notification | null> {
    const n = this.notifications.find((x) => {
      if (x.id !== query.id || x.organizationId !== query.organizationId) return false;
      if (query.recipientId && x.recipientId !== query.recipientId) return false;
      return true;
    });
    return n ? Notification.reconstitute({ ...n.props, id: n.id }) : null;
  }

  async save(notification: Notification): Promise<void> {
    const idx = this.notifications.findIndex((x) => x.id === notification.id);
    if (idx >= 0) {
      this.notifications[idx] = Notification.reconstitute({ ...notification.props, id: notification.id });
    } else {
      this.notifications.push(Notification.reconstitute({ ...notification.props, id: notification.id }));
    }
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const n of notifications) {
      await this.save(n);
    }
  }

  async list(query: {
    organizationId: string;
    recipientId?: string;
    isRead?: boolean;
    type?: string;
    businessType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    let filtered = this.notifications.filter((n) => n.organizationId === query.organizationId);

    if (query.recipientId) {
      filtered = filtered.filter((n) => n.recipientId === query.recipientId);
    }

    const unreadCount = filtered.filter((n) => !n.isRead).length;

    if (query.isRead !== undefined) {
      filtered = filtered.filter((n) => n.isRead === query.isRead);
    }

    if (query.type) {
      filtered = filtered.filter((n) => n.type === query.type);
    }

    if (query.businessType) {
      filtered = filtered.filter((n) => n.businessType === query.businessType);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => b.props.createdAt.getTime() - a.props.createdAt.getTime());

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((n) => Notification.reconstitute({ ...n.props, id: n.id })),
      total: filtered.length,
      unreadCount,
    };
  }

  async getUnreadCount(organizationId: string, recipientId: string): Promise<number> {
    return this.notifications.filter(
      (n) => n.organizationId === organizationId && n.recipientId === recipientId && !n.isRead
    ).length;
  }

  async getStats(organizationId: string, recipientId: string): Promise<NotificationStats> {
    const list = this.notifications.filter(
      (n) => n.organizationId === organizationId && n.recipientId === recipientId
    );

    const stats: NotificationStats = {
      total: list.length,
      unread: list.filter((n) => !n.isRead).length,
      byType: {
        info: { total: 0, unread: 0 },
        success: { total: 0, unread: 0 },
        warning: { total: 0, unread: 0 },
        error: { total: 0, unread: 0 },
        urgent: { total: 0, unread: 0 },
      },
    };

    for (const n of list) {
      const t = n.type || 'info';
      if (!stats.byType[t]) {
        stats.byType[t] = { total: 0, unread: 0 };
      }
      stats.byType[t].total += 1;
      if (!n.isRead) {
        stats.byType[t].unread += 1;
      }
    }

    return stats;
  }

  async markMultipleAsRead(organizationId: string, recipientId: string, notificationIds: string[]): Promise<number> {
    let count = 0;
    for (const n of this.notifications) {
      if (
        n.organizationId === organizationId &&
        n.recipientId === recipientId &&
        notificationIds.includes(n.id) &&
        !n.isRead
      ) {
        n.markAsRead();
        count++;
      }
    }
    return count;
  }

  async markAllAsRead(organizationId: string, recipientId: string): Promise<number> {
    let count = 0;
    for (const n of this.notifications) {
      if (n.organizationId === organizationId && n.recipientId === recipientId && !n.isRead) {
        n.markAsRead();
        count++;
      }
    }
    return count;
  }

  async delete(query: { id: string; organizationId: string; recipientId?: string }): Promise<boolean> {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => {
      if (n.id === query.id && n.organizationId === query.organizationId) {
        if (query.recipientId && n.recipientId !== query.recipientId) return true;
        return false;
      }
      return true;
    });
    return this.notifications.length < initialLen;
  }

  async clearAll(organizationId: string, recipientId: string): Promise<number> {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter(
      (n) => !(n.organizationId === organizationId && n.recipientId === recipientId)
    );
    return initialLen - this.notifications.length;
  }
}

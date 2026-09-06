import { INotificationRepository } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';

export class InMemoryNotificationRepository implements INotificationRepository {
  public notifications: Notification[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Notification | null> {
    const n = this.notifications.find((x) => x.id === query.id && x.organizationId === query.organizationId);
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

  async list(query: {
    organizationId: string;
    recipientId?: string;
    isRead?: boolean;
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

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((n) => Notification.reconstitute({ ...n.props, id: n.id })),
      total: filtered.length,
      unreadCount,
    };
  }
}

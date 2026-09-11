import { INotificationRepository, NotificationStats } from '../../domain/ports/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { NotificationModel } from '../persistence/notification.model';
import { NotificationType, NotificationPriority, NotificationBusinessType } from '../../domain/value-objects/NotificationEnums';

export class MongoNotificationRepository implements INotificationRepository {
  async findById(query: { id: string; organizationId: string; recipientId?: string }): Promise<Notification | null> {
    const filter: Record<string, any> = { _id: query.id, organizationId: query.organizationId };
    if (query.recipientId) filter.recipientId = query.recipientId;

    const doc = await NotificationModel.findOne(filter).lean();
    if (!doc) return null;

    return Notification.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      recipientId: doc.recipientId,
      businessType: doc.businessType as NotificationBusinessType,
      type: doc.type as NotificationType,
      title: doc.title,
      message: doc.message,
      metadata: doc.metadata,
      priority: doc.priority as NotificationPriority,
      isRead: doc.isRead,
      readAt: doc.readAt ? new Date(doc.readAt) : null,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async save(notification: Notification): Promise<void> {
    await NotificationModel.findByIdAndUpdate(
      notification.id,
      {
        _id: notification.id,
        organizationId: notification.organizationId,
        recipientId: notification.recipientId,
        businessType: notification.businessType,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        priority: notification.priority,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.props.createdAt,
        updatedAt: notification.props.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    if (!notifications.length) return;
    const ops = notifications.map((n) => ({
      updateOne: {
        filter: { _id: n.id },
        update: {
          $set: {
            _id: n.id,
            organizationId: n.organizationId,
            recipientId: n.recipientId,
            businessType: n.businessType,
            type: n.type,
            title: n.title,
            message: n.message,
            metadata: n.metadata,
            priority: n.priority,
            isRead: n.isRead,
            readAt: n.readAt,
            createdAt: n.props.createdAt,
            updatedAt: n.props.updatedAt,
          },
        },
        upsert: true,
      },
    }));
    await NotificationModel.bulkWrite(ops);
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
    const filter: Record<string, any> = { organizationId: query.organizationId };
    if (query.recipientId) filter.recipientId = query.recipientId;
    if (query.isRead !== undefined) filter.isRead = query.isRead;
    if (query.type) filter.type = query.type;
    if (query.businessType) filter.businessType = query.businessType;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({
        organizationId: query.organizationId,
        ...(query.recipientId ? { recipientId: query.recipientId } : {}),
        isRead: false,
      }),
    ]);

    const data = docs.map((doc) =>
      Notification.reconstitute({
        id: doc._id,
        organizationId: doc.organizationId,
        recipientId: doc.recipientId,
        businessType: doc.businessType as NotificationBusinessType,
        type: doc.type as NotificationType,
        title: doc.title,
        message: doc.message,
        metadata: doc.metadata,
        priority: doc.priority as NotificationPriority,
        isRead: doc.isRead,
        readAt: doc.readAt ? new Date(doc.readAt) : null,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    );

    return { data, total, unreadCount };
  }

  async getUnreadCount(organizationId: string, recipientId: string): Promise<number> {
    return NotificationModel.countDocuments({ organizationId, recipientId, isRead: false });
  }

  async getStats(organizationId: string, recipientId: string): Promise<NotificationStats> {
    const docs = await NotificationModel.find({ organizationId, recipientId }).select('type isRead').lean();

    const stats: NotificationStats = {
      total: docs.length,
      unread: docs.filter((d) => !d.isRead).length,
      byType: {
        info: { total: 0, unread: 0 },
        success: { total: 0, unread: 0 },
        warning: { total: 0, unread: 0 },
        error: { total: 0, unread: 0 },
        urgent: { total: 0, unread: 0 },
      },
    };

    for (const d of docs) {
      const t = d.type || 'info';
      if (!stats.byType[t]) {
        stats.byType[t] = { total: 0, unread: 0 };
      }
      stats.byType[t].total += 1;
      if (!d.isRead) {
        stats.byType[t].unread += 1;
      }
    }

    return stats;
  }

  async markMultipleAsRead(organizationId: string, recipientId: string, notificationIds: string[]): Promise<number> {
    const res = await NotificationModel.updateMany(
      { _id: { $in: notificationIds }, organizationId, recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } }
    );
    return res.modifiedCount;
  }

  async markAllAsRead(organizationId: string, recipientId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { organizationId, recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } }
    );
    return res.modifiedCount;
  }

  async delete(query: { id: string; organizationId: string; recipientId?: string }): Promise<boolean> {
    const filter: Record<string, any> = { _id: query.id, organizationId: query.organizationId };
    if (query.recipientId) filter.recipientId = query.recipientId;

    const res = await NotificationModel.deleteOne(filter);
    return res.deletedCount > 0;
  }

  async clearAll(organizationId: string, recipientId: string): Promise<number> {
    const res = await NotificationModel.deleteMany({ organizationId, recipientId });
    return res.deletedCount;
  }
}

import { InMemoryNotificationRepository } from '../../../../src/modules/notification/infrastructure/repositories/InMemoryNotificationRepository';
import { ListNotificationsUseCase } from '../../../../src/modules/notification/application/use-cases/ListNotificationsUseCase';
import { GetNotificationStatsUseCase } from '../../../../src/modules/notification/application/use-cases/GetNotificationStatsUseCase';
import { GetUnreadCountUseCase } from '../../../../src/modules/notification/application/use-cases/GetUnreadCountUseCase';
import { MarkNotificationReadUseCase } from '../../../../src/modules/notification/application/use-cases/MarkNotificationReadUseCase';
import { DeleteNotificationUseCase } from '../../../../src/modules/notification/application/use-cases/DeleteNotificationUseCase';
import { Notification } from '../../../../src/modules/notification/domain/entities/Notification';
import { NotificationType, NotificationBusinessType } from '../../../../src/modules/notification/domain/value-objects/NotificationEnums';

describe('Notification Full Parity Use Cases', () => {
  let repo: InMemoryNotificationRepository;
  let listUseCase: ListNotificationsUseCase;
  let statsUseCase: GetNotificationStatsUseCase;
  let unreadCountUseCase: GetUnreadCountUseCase;
  let markReadUseCase: MarkNotificationReadUseCase;
  let deleteUseCase: DeleteNotificationUseCase;

  const orgId = 'org-parity-test';
  const recipient = 'user-100';

  beforeEach(async () => {
    repo = new InMemoryNotificationRepository();
    listUseCase = new ListNotificationsUseCase(repo);
    statsUseCase = new GetNotificationStatsUseCase(repo);
    unreadCountUseCase = new GetUnreadCountUseCase(repo);
    markReadUseCase = new MarkNotificationReadUseCase(repo);
    deleteUseCase = new DeleteNotificationUseCase(repo);

    // Seed 3 test notifications
    const n1 = Notification.create({
      id: 'notif-1',
      organizationId: orgId,
      recipientId: recipient,
      title: 'Invoice Overdue',
      message: 'Invoice #101 is overdue',
      type: NotificationType.WARNING,
      businessType: NotificationBusinessType.PAYMENT_OVERDUE,
    });

    const n2 = Notification.create({
      id: 'notif-2',
      organizationId: orgId,
      recipientId: recipient,
      title: 'Payment Received',
      message: 'Payment received for invoice',
      type: NotificationType.SUCCESS,
      businessType: NotificationBusinessType.PAYMENT_RECEIVED,
    });

    const n3 = Notification.create({
      id: 'notif-3',
      organizationId: orgId,
      recipientId: recipient,
      title: 'System Alert',
      message: 'Scheduled maintenance',
      type: NotificationType.INFO,
      businessType: NotificationBusinessType.SYSTEM,
    });
    n3.markAsRead();

    await repo.saveMany([n1, n2, n3]);
  });

  describe('ListNotificationsUseCase', () => {
    it('should list all notifications for recipient with pagination', async () => {
      const result = await listUseCase.execute({ page: 1, limit: 10 }, { organizationId: orgId, userId: recipient });
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(3);
      expect(result.unreadCount).toBe(2);
    });

    it('should filter unread notifications only', async () => {
      const result = await listUseCase.execute({ isRead: false }, { organizationId: orgId, userId: recipient });
      expect(result.total).toBe(2);
      expect(result.data.every((n) => !n.isRead)).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await listUseCase.execute({ type: NotificationType.WARNING }, { organizationId: orgId, userId: recipient });
      expect(result.total).toBe(1);
      expect(result.data[0]!.id).toBe('notif-1');
    });
  });

  describe('GetNotificationStatsUseCase & GetUnreadCountUseCase', () => {
    it('should return statistical breakdowns and accurate unread count', async () => {
      const stats = await statsUseCase.execute({ organizationId: orgId, recipientId: recipient });
      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(2);
      expect(stats.byType[NotificationType.WARNING]).toEqual({ total: 1, unread: 1 });
      expect(stats.byType[NotificationType.INFO]).toEqual({ total: 1, unread: 0 });

      const unreadCount = await unreadCountUseCase.execute({ organizationId: orgId, recipientId: recipient });
      expect(unreadCount).toBe(2);
    });
  });

  describe('MarkNotificationReadUseCase', () => {
    it('should mark a single notification as read', async () => {
      const updated = await markReadUseCase.execute(
        { notificationId: 'notif-1' },
        { organizationId: orgId, recipientId: recipient }
      );
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();

      const count = await unreadCountUseCase.execute({ organizationId: orgId, recipientId: recipient });
      expect(count).toBe(1);
    });

    it('should bulk mark multiple notifications as read', async () => {
      const count = await markReadUseCase.executeMultiple(
        { notificationIds: ['notif-1', 'notif-2'] },
        { organizationId: orgId, recipientId: recipient }
      );
      expect(count).toBe(2);

      const unread = await unreadCountUseCase.execute({ organizationId: orgId, recipientId: recipient });
      expect(unread).toBe(0);
    });

    it('should mark all notifications as read', async () => {
      const count = await markReadUseCase.executeAll({ organizationId: orgId, recipientId: recipient });
      expect(count).toBe(2);

      const unread = await unreadCountUseCase.execute({ organizationId: orgId, recipientId: recipient });
      expect(unread).toBe(0);
    });
  });

  describe('DeleteNotificationUseCase', () => {
    it('should delete a single notification', async () => {
      await deleteUseCase.executeDeleteOne({ id: 'notif-1', organizationId: orgId, recipientId: recipient });
      const found = await repo.findById({ id: 'notif-1', organizationId: orgId, recipientId: recipient });
      expect(found).toBeNull();

      const list = await listUseCase.execute({}, { organizationId: orgId, userId: recipient });
      expect(list.total).toBe(2);
    });

    it('should clear all notifications for recipient', async () => {
      const cleared = await deleteUseCase.executeClearAll({ organizationId: orgId, recipientId: recipient });
      expect(cleared).toBe(3);

      const list = await listUseCase.execute({}, { organizationId: orgId, userId: recipient });
      expect(list.total).toBe(0);
    });
  });
});

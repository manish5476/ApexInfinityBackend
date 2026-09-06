import { Notification } from '../../../../src/modules/notification/domain/entities/Notification';
import { NotificationType, NotificationPriority, NotificationBusinessType } from '../../../../src/modules/notification/domain/value-objects/NotificationEnums';
import { NotificationSentEvent } from '../../../../src/modules/notification/domain/events/NotificationSentEvent';

describe('Notification Entity', () => {
  const baseParams = {
    id: 'notif-1',
    organizationId: 'org-1',
    recipientId: 'user-1',
    title: 'Payment Received',
    message: 'Customer paid invoice INV-001',
    businessType: NotificationBusinessType.PAYMENT_RECEIVED,
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.HIGH,
  };

  it('should create a notification in unread state and emit NotificationSentEvent', () => {
    const notification = Notification.create(baseParams);

    expect(notification.id).toBe('notif-1');
    expect(notification.title).toBe('Payment Received');
    expect(notification.isRead).toBe(false);
    expect(notification.readAt).toBeNull();
    expect(notification.businessType).toBe(NotificationBusinessType.PAYMENT_RECEIVED);
    expect(notification.type).toBe(NotificationType.SUCCESS);

    expect(notification.domainEvents).toHaveLength(1);
    expect(notification.domainEvents[0]).toBeInstanceOf(NotificationSentEvent);
  });

  it('should mark as read and record timestamp', () => {
    const notification = Notification.create(baseParams);
    notification.markAsRead();

    expect(notification.isRead).toBe(true);
    expect(notification.readAt).toBeInstanceOf(Date);
  });

  it('should mark as unread', () => {
    const notification = Notification.create(baseParams);
    notification.markAsRead();
    notification.markAsUnread();

    expect(notification.isRead).toBe(false);
    expect(notification.readAt).toBeNull();
  });

  it('should reject empty title or message', () => {
    expect(() =>
      Notification.create({
        ...baseParams,
        title: '   ',
      })
    ).toThrow('Notification title is required');

    expect(() =>
      Notification.create({
        ...baseParams,
        message: '',
      })
    ).toThrow('Notification message is required');
  });
});

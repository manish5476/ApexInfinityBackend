import { SendNotificationUseCase } from '../../../../src/modules/notification/application/use-cases/SendNotificationUseCase';
import { InMemoryNotificationRepository } from '../../../../src/modules/notification/infrastructure/repositories/InMemoryNotificationRepository';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { NotificationType, NotificationBusinessType } from '../../../../src/modules/notification/domain/value-objects/NotificationEnums';

describe('SendNotificationUseCase', () => {
  let notificationRepo: InMemoryNotificationRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let useCase: SendNotificationUseCase;

  beforeEach(() => {
    notificationRepo = new InMemoryNotificationRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    useCase = new SendNotificationUseCase(notificationRepo, eventBus);
  });

  it('should create notification, save it, and publish domain event', async () => {
    const notif = await useCase.execute(
      {
        recipientId: 'user-42',
        title: 'Low Stock Alert',
        message: 'Product SKU-999 is below 5 units',
        businessType: NotificationBusinessType.STOCK_ALERT,
        type: NotificationType.WARNING,
      },
      { organizationId: 'org-test' }
    );

    expect(notif.id).toBeDefined();
    expect(notif.recipientId).toBe('user-42');
    expect(notif.title).toBe('Low Stock Alert');
    expect(notif.isRead).toBe(false);
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);

    const saved = await notificationRepo.findById({ id: notif.id, organizationId: 'org-test' });
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('Low Stock Alert');
  });
});

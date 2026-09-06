import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class NotificationSentEvent implements IDomainEvent<any> {
  public readonly eventName = 'NotificationSentEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { notificationId: string; organizationId: string; recipientId: string; businessType: string };

  constructor(notificationId: string, organizationId: string, recipientId: string, businessType: string) {
    this.aggregateId = notificationId;
    this.occurredOn = new Date();
    this.payload = { notificationId, organizationId, recipientId, businessType };
  }
}

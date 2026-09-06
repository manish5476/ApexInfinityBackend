import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export class WebhookTriggeredEvent implements IDomainEvent<any> {
  public readonly eventName = 'WebhookTriggeredEvent';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly payload: { webhookId: string; organizationId: string; event: string };

  constructor(webhookId: string, organizationId: string, event: string) {
    this.aggregateId = webhookId;
    this.occurredOn = new Date();
    this.payload = { webhookId, organizationId, event };
  }
}

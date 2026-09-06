import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { WebhookTriggeredEvent } from '../../domain/events/WebhookTriggeredEvent';

export interface TriggerWebhookParams {
  organizationId: string;
  eventName: string;
  payload: Record<string, unknown>;
}

export class TriggerWebhookDeliveriesUseCase {
  constructor(
    private readonly webhookRepo: IWebhookRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(params: TriggerWebhookParams): Promise<{ triggeredCount: number; subscriberIds: string[] }> {
    const subscriptions = await this.webhookRepo.findSubscribed({
      organizationId: params.organizationId,
      eventName: params.eventName,
    });

    const subscriberIds: string[] = [];

    for (const sub of subscriptions) {
      sub.recordSuccess();
      await this.webhookRepo.save(sub);
      subscriberIds.push(sub.id);

      await this.eventBus.publishDomainEvent(
        new WebhookTriggeredEvent(sub.id, params.organizationId, params.eventName)
      );
    }

    return {
      triggeredCount: subscriptions.length,
      subscriberIds,
    };
  }
}

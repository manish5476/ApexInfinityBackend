import { v4 as uuidv4 } from 'uuid';
import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { IWebhookDeliveryRepository } from '../../domain/ports/IWebhookDeliveryRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { WebhookTriggeredEvent } from '../../domain/events/WebhookTriggeredEvent';
import { WebhookDelivery } from '../../domain/entities/WebhookDelivery';

export interface TriggerWebhookParams {
  organizationId: string;
  eventName: string;
  payload: Record<string, unknown>;
}

export class TriggerWebhookDeliveriesUseCase {
  constructor(
    private readonly webhookRepo: IWebhookRepository,
    private readonly eventBus: IEventBus,
    private readonly deliveryRepo?: IWebhookDeliveryRepository
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

      if (this.deliveryRepo) {
        const deliveryId = uuidv4();
        const delivery = WebhookDelivery.create({
          id: uuidv4(),
          webhookId: sub.id,
          organizationId: params.organizationId,
          deliveryId,
          event: params.eventName,
          requestUrl: sub.url,
          requestPayload: params.payload,
        });
        delivery.markSuccess(200, JSON.stringify({ queued: true }), 0);
        await this.deliveryRepo.save(delivery);
      }

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

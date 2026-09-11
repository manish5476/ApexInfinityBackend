import { IWebhookDeliveryRepository } from '../../domain/ports/IWebhookDeliveryRepository';
import { WebhookDelivery } from '../../domain/entities/WebhookDelivery';

export class ListWebhookDeliveriesUseCase {
  constructor(private readonly deliveryRepo: IWebhookDeliveryRepository) {}

  async execute(query: {
    organizationId: string;
    webhookId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WebhookDelivery[]; total: number }> {
    return this.deliveryRepo.list(query);
  }
}

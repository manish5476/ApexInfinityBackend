import { IWebhookDeliveryRepository, WebhookDeliveryStat } from '../../domain/ports/IWebhookDeliveryRepository';

export class GetWebhookStatsUseCase {
  constructor(private readonly deliveryRepo: IWebhookDeliveryRepository) {}

  async execute(params: { organizationId: string; sinceDays?: number }): Promise<WebhookDeliveryStat[]> {
    return this.deliveryRepo.getStats(params.organizationId, params.sinceDays);
  }
}

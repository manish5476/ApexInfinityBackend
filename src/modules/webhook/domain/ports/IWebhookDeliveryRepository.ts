import { WebhookDelivery } from '../entities/WebhookDelivery';

export interface WebhookDeliveryStat {
  status: string;
  count: number;
  avgResponseTime: number;
}

export interface IWebhookDeliveryRepository {
  findById(query: { id: string; organizationId: string }): Promise<WebhookDelivery | null>;
  findByDeliveryId(query: { deliveryId: string; organizationId: string }): Promise<WebhookDelivery | null>;
  save(delivery: WebhookDelivery): Promise<void>;
  list(query: {
    organizationId: string;
    webhookId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WebhookDelivery[]; total: number }>;
  getStats(organizationId: string, sinceDays?: number): Promise<WebhookDeliveryStat[]>;
}

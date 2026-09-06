import { WebhookSubscription } from '../entities/WebhookSubscription';

export interface IWebhookRepository {
  findById(query: { id: string; organizationId: string }): Promise<WebhookSubscription | null>;
  findSubscribed(query: { organizationId: string; eventName: string }): Promise<WebhookSubscription[]>;
  save(webhook: WebhookSubscription): Promise<void>;
  list(query: { organizationId: string; page?: number; limit?: number; isActive?: boolean }): Promise<{
    data: WebhookSubscription[];
    total: number;
  }>;
}

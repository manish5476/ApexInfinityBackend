import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';

export class InMemoryWebhookRepository implements IWebhookRepository {
  public webhooks: WebhookSubscription[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<WebhookSubscription | null> {
    const w = this.webhooks.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return w ? WebhookSubscription.reconstitute({ ...w.props, id: w.id }) : null;
  }

  async findSubscribed(query: { organizationId: string; eventName: string }): Promise<WebhookSubscription[]> {
    return this.webhooks
      .filter((w) => w.organizationId === query.organizationId && w.matchesEvent(query.eventName))
      .map((w) => WebhookSubscription.reconstitute({ ...w.props, id: w.id }));
  }

  async save(webhook: WebhookSubscription): Promise<void> {
    const idx = this.webhooks.findIndex((x) => x.id === webhook.id);
    if (idx >= 0) {
      this.webhooks[idx] = WebhookSubscription.reconstitute({ ...webhook.props, id: webhook.id });
    } else {
      this.webhooks.push(WebhookSubscription.reconstitute({ ...webhook.props, id: webhook.id }));
    }
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const initialLen = this.webhooks.length;
    this.webhooks = this.webhooks.filter(
      (w) => !(w.id === query.id && w.organizationId === query.organizationId)
    );
    return this.webhooks.length < initialLen;
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: WebhookSubscription[]; total: number }> {
    let filtered = this.webhooks.filter((w) => w.organizationId === query.organizationId);

    if (query.isActive !== undefined) {
      filtered = filtered.filter((w) => w.isActive === query.isActive);
    }

    filtered.sort((a, b) => b.props.createdAt.getTime() - a.props.createdAt.getTime());

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((w) => WebhookSubscription.reconstitute({ ...w.props, id: w.id })),
      total: filtered.length,
    };
  }
}

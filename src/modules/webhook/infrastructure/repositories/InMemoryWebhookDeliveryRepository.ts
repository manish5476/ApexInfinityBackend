import { IWebhookDeliveryRepository, WebhookDeliveryStat } from '../../domain/ports/IWebhookDeliveryRepository';
import { WebhookDelivery } from '../../domain/entities/WebhookDelivery';

export class InMemoryWebhookDeliveryRepository implements IWebhookDeliveryRepository {
  public deliveries: WebhookDelivery[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<WebhookDelivery | null> {
    const d = this.deliveries.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return d ? WebhookDelivery.reconstitute({ ...d.props, id: d.id }) : null;
  }

  async findByDeliveryId(query: { deliveryId: string; organizationId: string }): Promise<WebhookDelivery | null> {
    const d = this.deliveries.find((x) => x.deliveryId === query.deliveryId && x.organizationId === query.organizationId);
    return d ? WebhookDelivery.reconstitute({ ...d.props, id: d.id }) : null;
  }

  async save(delivery: WebhookDelivery): Promise<void> {
    const idx = this.deliveries.findIndex((x) => x.id === delivery.id);
    if (idx >= 0) {
      this.deliveries[idx] = WebhookDelivery.reconstitute({ ...delivery.props, id: delivery.id });
    } else {
      this.deliveries.push(WebhookDelivery.reconstitute({ ...delivery.props, id: delivery.id }));
    }
  }

  async list(query: {
    organizationId: string;
    webhookId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WebhookDelivery[]; total: number }> {
    let filtered = this.deliveries.filter((d) => d.organizationId === query.organizationId);

    if (query.webhookId) {
      filtered = filtered.filter((d) => d.webhookId === query.webhookId);
    }
    if (query.status) {
      filtered = filtered.filter((d) => d.status === query.status);
    }

    filtered.sort((a, b) => b.props.createdAt.getTime() - a.props.createdAt.getTime());

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((d) => WebhookDelivery.reconstitute({ ...d.props, id: d.id })),
      total: filtered.length,
    };
  }

  async getStats(organizationId: string, sinceDays: number = 7): Promise<WebhookDeliveryStat[]> {
    const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const recent = this.deliveries.filter(
      (d) => d.organizationId === organizationId && d.props.createdAt >= cutoff
    );

    const groupMap = new Map<string, { count: number; totalResponseTime: number; responseTimeCount: number }>();

    for (const d of recent) {
      const s = d.status;
      const current = groupMap.get(s) || { count: 0, totalResponseTime: 0, responseTimeCount: 0 };
      current.count++;
      if (d.responseTimeMs !== undefined) {
        current.totalResponseTime += d.responseTimeMs;
        current.responseTimeCount++;
      }
      groupMap.set(s, current);
    }

    return Array.from(groupMap.entries()).map(([status, val]) => ({
      status,
      count: val.count,
      avgResponseTime: val.responseTimeCount > 0 ? Math.round(val.totalResponseTime / val.responseTimeCount) : 0,
    }));
  }
}

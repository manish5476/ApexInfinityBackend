import { IWebhookDeliveryRepository, WebhookDeliveryStat } from '../../domain/ports/IWebhookDeliveryRepository';
import { WebhookDelivery, WebhookDeliveryStatus } from '../../domain/entities/WebhookDelivery';
import { WebhookDeliveryModel } from '../persistence/webhook-delivery.model';

export class MongoWebhookDeliveryRepository implements IWebhookDeliveryRepository {
  async findById(query: { id: string; organizationId: string }): Promise<WebhookDelivery | null> {
    const doc = await WebhookDeliveryModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    if (!doc) return null;

    return WebhookDelivery.reconstitute({
      id: doc._id,
      webhookId: doc.webhookId,
      organizationId: doc.organizationId,
      deliveryId: doc.deliveryId,
      event: doc.event,
      isReplay: doc.isReplay,
      originalDeliveryId: doc.originalDeliveryId,
      requestUrl: doc.requestUrl,
      requestPayload: doc.requestPayload,
      requestHeaders: doc.requestHeaders,
      responseStatus: doc.responseStatus,
      responseBody: doc.responseBody,
      responseTimeMs: doc.responseTimeMs,
      attempt: doc.attempt,
      maxAttempts: doc.maxAttempts,
      nextRetryAt: doc.nextRetryAt ? new Date(doc.nextRetryAt) : null,
      status: doc.status as WebhookDeliveryStatus,
      errorMessage: doc.errorMessage,
      errorCode: doc.errorCode,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async findByDeliveryId(query: { deliveryId: string; organizationId: string }): Promise<WebhookDelivery | null> {
    const doc = await WebhookDeliveryModel.findOne({ deliveryId: query.deliveryId, organizationId: query.organizationId }).lean();
    if (!doc) return null;

    return WebhookDelivery.reconstitute({
      id: doc._id,
      webhookId: doc.webhookId,
      organizationId: doc.organizationId,
      deliveryId: doc.deliveryId,
      event: doc.event,
      isReplay: doc.isReplay,
      originalDeliveryId: doc.originalDeliveryId,
      requestUrl: doc.requestUrl,
      requestPayload: doc.requestPayload,
      requestHeaders: doc.requestHeaders,
      responseStatus: doc.responseStatus,
      responseBody: doc.responseBody,
      responseTimeMs: doc.responseTimeMs,
      attempt: doc.attempt,
      maxAttempts: doc.maxAttempts,
      nextRetryAt: doc.nextRetryAt ? new Date(doc.nextRetryAt) : null,
      status: doc.status as WebhookDeliveryStatus,
      errorMessage: doc.errorMessage,
      errorCode: doc.errorCode,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async save(delivery: WebhookDelivery): Promise<void> {
    await WebhookDeliveryModel.findByIdAndUpdate(
      delivery.id,
      {
        _id: delivery.id,
        webhookId: delivery.webhookId,
        organizationId: delivery.organizationId,
        deliveryId: delivery.deliveryId,
        event: delivery.event,
        isReplay: delivery.isReplay,
        originalDeliveryId: delivery.originalDeliveryId,
        requestUrl: delivery.requestUrl,
        requestPayload: delivery.requestPayload,
        requestHeaders: delivery.requestHeaders,
        responseStatus: delivery.responseStatus,
        responseBody: delivery.responseBody,
        responseTimeMs: delivery.responseTimeMs,
        attempt: delivery.attempt,
        maxAttempts: delivery.maxAttempts,
        nextRetryAt: delivery.props.nextRetryAt,
        status: delivery.status,
        errorMessage: delivery.errorMessage,
        errorCode: delivery.errorCode,
        createdAt: delivery.props.createdAt,
        updatedAt: delivery.props.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async list(query: {
    organizationId: string;
    webhookId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WebhookDelivery[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };
    if (query.webhookId) filter.webhookId = query.webhookId;
    if (query.status) filter.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      WebhookDeliveryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WebhookDeliveryModel.countDocuments(filter),
    ]);

    const data = docs.map((doc) =>
      WebhookDelivery.reconstitute({
        id: doc._id,
        webhookId: doc.webhookId,
        organizationId: doc.organizationId,
        deliveryId: doc.deliveryId,
        event: doc.event,
        isReplay: doc.isReplay,
        originalDeliveryId: doc.originalDeliveryId,
        requestUrl: doc.requestUrl,
        requestPayload: doc.requestPayload,
        requestHeaders: doc.requestHeaders,
        responseStatus: doc.responseStatus,
        responseBody: doc.responseBody,
        responseTimeMs: doc.responseTimeMs,
        attempt: doc.attempt,
        maxAttempts: doc.maxAttempts,
        nextRetryAt: doc.nextRetryAt ? new Date(doc.nextRetryAt) : null,
        status: doc.status as WebhookDeliveryStatus,
        errorMessage: doc.errorMessage,
        errorCode: doc.errorCode,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    );

    return { data, total };
  }

  async getStats(organizationId: string, sinceDays: number = 7): Promise<WebhookDeliveryStat[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const stats = await WebhookDeliveryModel.aggregate([
      { $match: { organizationId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTimeMs' },
        },
      },
    ]);

    return stats.map((s) => ({
      status: s._id,
      count: s.count,
      avgResponseTime: s.avgResponseTime ? Math.round(s.avgResponseTime) : 0,
    }));
  }
}

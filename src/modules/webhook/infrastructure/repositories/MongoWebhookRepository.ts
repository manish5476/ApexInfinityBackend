import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';
import { WebhookModel } from '../persistence/webhook.model';
import { WebhookStatus } from '../../domain/value-objects/WebhookEnums';

export class MongoWebhookRepository implements IWebhookRepository {
  async findById(query: { id: string; organizationId: string }): Promise<WebhookSubscription | null> {
    const doc = await WebhookModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    if (!doc) return null;

    return WebhookSubscription.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      name: doc.name,
      url: doc.url,
      secret: doc.secret,
      events: doc.events,
      isActive: doc.isActive,
      status: doc.status as WebhookStatus,
      failureCount: doc.failureCount,
      lastTriggeredAt: doc.lastTriggeredAt ? new Date(doc.lastTriggeredAt) : null,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async findSubscribed(query: { organizationId: string; eventName: string }): Promise<WebhookSubscription[]> {
    const docs = await WebhookModel.find({
      organizationId: query.organizationId,
      isActive: true,
      events: { $in: [query.eventName, '*'] },
    }).lean();

    return docs.map((doc) =>
      WebhookSubscription.reconstitute({
        id: doc._id,
        organizationId: doc.organizationId,
        name: doc.name,
        url: doc.url,
        secret: doc.secret,
        events: doc.events,
        isActive: doc.isActive,
        status: doc.status as WebhookStatus,
        failureCount: doc.failureCount,
        lastTriggeredAt: doc.lastTriggeredAt ? new Date(doc.lastTriggeredAt) : null,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    );
  }

  async save(webhook: WebhookSubscription): Promise<void> {
    await WebhookModel.findByIdAndUpdate(
      webhook.id,
      {
        _id: webhook.id,
        organizationId: webhook.organizationId,
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        isActive: webhook.isActive,
        status: webhook.status,
        failureCount: webhook.failureCount,
        lastTriggeredAt: webhook.lastTriggeredAt,
        createdAt: webhook.props.createdAt,
        updatedAt: webhook.props.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const res = await WebhookModel.deleteOne({ _id: query.id, organizationId: query.organizationId });
    return res.deletedCount > 0;
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: WebhookSubscription[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      WebhookModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WebhookModel.countDocuments(filter),
    ]);

    const data = docs.map((doc) =>
      WebhookSubscription.reconstitute({
        id: doc._id,
        organizationId: doc.organizationId,
        name: doc.name,
        url: doc.url,
        secret: doc.secret,
        events: doc.events,
        isActive: doc.isActive,
        status: doc.status as WebhookStatus,
        failureCount: doc.failureCount,
        lastTriggeredAt: doc.lastTriggeredAt ? new Date(doc.lastTriggeredAt) : null,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    );

    return { data, total };
  }
}

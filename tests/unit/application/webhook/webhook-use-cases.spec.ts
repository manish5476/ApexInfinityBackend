import axios from 'axios';
import { InMemoryWebhookRepository } from '../../../../src/modules/webhook/infrastructure/repositories/InMemoryWebhookRepository';
import { InMemoryWebhookDeliveryRepository } from '../../../../src/modules/webhook/infrastructure/repositories/InMemoryWebhookDeliveryRepository';
import { WebhookSubscription } from '../../../../src/modules/webhook/domain/entities/WebhookSubscription';
import { WebhookDelivery } from '../../../../src/modules/webhook/domain/entities/WebhookDelivery';
import { GetWebhookByIdUseCase } from '../../../../src/modules/webhook/application/use-cases/GetWebhookByIdUseCase';
import { UpdateWebhookUseCase } from '../../../../src/modules/webhook/application/use-cases/UpdateWebhookUseCase';
import { DeleteWebhookUseCase } from '../../../../src/modules/webhook/application/use-cases/DeleteWebhookUseCase';
import { TestWebhookUseCase } from '../../../../src/modules/webhook/application/use-cases/TestWebhookUseCase';
import { ListWebhookDeliveriesUseCase } from '../../../../src/modules/webhook/application/use-cases/ListWebhookDeliveriesUseCase';
import { GetWebhookStatsUseCase } from '../../../../src/modules/webhook/application/use-cases/GetWebhookStatsUseCase';
import { ReplayWebhookDeliveryUseCase } from '../../../../src/modules/webhook/application/use-cases/ReplayWebhookDeliveryUseCase';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Webhook Full Parity Use Cases', () => {
  let webhookRepo: InMemoryWebhookRepository;
  let deliveryRepo: InMemoryWebhookDeliveryRepository;
  let getByIdUseCase: GetWebhookByIdUseCase;
  let updateUseCase: UpdateWebhookUseCase;
  let deleteUseCase: DeleteWebhookUseCase;
  let testWebhookUseCase: TestWebhookUseCase;
  let listDeliveriesUseCase: ListWebhookDeliveriesUseCase;
  let getStatsUseCase: GetWebhookStatsUseCase;
  let replayUseCase: ReplayWebhookDeliveryUseCase;

  const orgId = 'org-webhook-test';
  let subscription: WebhookSubscription;

  beforeEach(async () => {
    jest.clearAllMocks();
    webhookRepo = new InMemoryWebhookRepository();
    deliveryRepo = new InMemoryWebhookDeliveryRepository();

    getByIdUseCase = new GetWebhookByIdUseCase(webhookRepo);
    updateUseCase = new UpdateWebhookUseCase(webhookRepo);
    deleteUseCase = new DeleteWebhookUseCase(webhookRepo);
    testWebhookUseCase = new TestWebhookUseCase(webhookRepo, deliveryRepo);
    listDeliveriesUseCase = new ListWebhookDeliveriesUseCase(deliveryRepo);
    getStatsUseCase = new GetWebhookStatsUseCase(deliveryRepo);
    replayUseCase = new ReplayWebhookDeliveryUseCase(webhookRepo, deliveryRepo);

    subscription = WebhookSubscription.create({
      id: 'sub-test-1',
      organizationId: orgId,
      name: 'Inventory Alerts',
      url: 'https://webhook.site/alerts',
      events: ['stock.low', 'stock.out'],
      secret: 'super-secret-key-123',
    });

    await webhookRepo.save(subscription);
  });

  describe('GetWebhookByIdUseCase & UpdateWebhookUseCase & DeleteWebhookUseCase', () => {
    it('should retrieve webhook by id', async () => {
      const retrieved = await getByIdUseCase.execute({ id: subscription.id, organizationId: orgId });
      expect(retrieved.id).toBe(subscription.id);
      expect(retrieved.name).toBe('Inventory Alerts');
    });

    it('should throw NotFoundError if webhook does not exist', async () => {
      await expect(getByIdUseCase.execute({ id: 'non-existent', organizationId: orgId })).rejects.toThrow('not found');
    });

    it('should update webhook details', async () => {
      const updated = await updateUseCase.execute({
        id: subscription.id,
        organizationId: orgId,
        name: 'Updated Alerts Endpoint',
        events: ['stock.low', 'stock.restocked'],
      });

      expect(updated.name).toBe('Updated Alerts Endpoint');
      expect(updated.events).toEqual(['stock.low', 'stock.restocked']);
    });

    it('should delete webhook', async () => {
      await deleteUseCase.execute({ id: subscription.id, organizationId: orgId });
      const found = await webhookRepo.findById({ id: subscription.id, organizationId: orgId });
      expect(found).toBeNull();
    });
  });

  describe('TestWebhookUseCase (HMAC Signature & Delivery Recording)', () => {
    it('should dispatch test webhook with HMAC-SHA256 headers and record success delivery', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { received: true },
      } as any);

      const result = await testWebhookUseCase.execute({ id: subscription.id, organizationId: orgId });

      expect(result.success).toBe(true);
      expect(result.deliveryId).toBeDefined();
      expect(result.responseStatus).toBe(200);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      const call = (mockedAxios.post.mock.calls as any)[0];
      const calledUrl = call[0];
      const config = call[2];
      expect(calledUrl).toBe(subscription.url);
      expect(config?.headers?.['X-Apex-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(config?.headers?.['X-Apex-Delivery-Id']).toBe(result.deliveryId);

      // Verify delivery was persisted
      const deliveries = await deliveryRepo.list({ organizationId: orgId });
      expect(deliveries.total).toBe(1);
      expect(deliveries.data[0]!.status).toBe('success');
    });

    it('should handle test webhook network or HTTP failure gracefully and record failure delivery', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 500,
        data: 'Internal Server Error',
      } as any);

      const result = await testWebhookUseCase.execute({ id: subscription.id, organizationId: orgId });

      expect(result.success).toBe(false);
      expect(result.responseStatus).toBe(500);

      const deliveries = await deliveryRepo.list({ organizationId: orgId });
      expect(deliveries.total).toBe(1);
      expect(deliveries.data[0]!.status).toBe('retrying');
    });
  });

  describe('ListWebhookDeliveriesUseCase & GetWebhookStatsUseCase', () => {
    it('should list deliveries with filters and return status breakdown statistics', async () => {
      const d1 = WebhookDelivery.create({
        id: 'del-1',
        webhookId: subscription.id,
        organizationId: orgId,
        deliveryId: 'del-id-1',
        event: 'stock.low',
        requestUrl: subscription.url,
        requestPayload: { item: 'part-1' },
      });
      d1.markSuccess(200, '{}', 120);

      const d2 = WebhookDelivery.create({
        id: 'del-2',
        webhookId: subscription.id,
        organizationId: orgId,
        deliveryId: 'del-id-2',
        event: 'stock.low',
        requestUrl: subscription.url,
        requestPayload: { item: 'part-2' },
        maxAttempts: 1,
      });
      d2.markFailure(504, 'Gateway Timeout', 'TIMEOUT', 10000);

      await deliveryRepo.save(d1);
      await deliveryRepo.save(d2);

      const list = await listDeliveriesUseCase.execute({ organizationId: orgId, status: 'success' });
      expect(list.total).toBe(1);
      expect(list.data[0]!.deliveryId).toBe('del-id-1');

      const stats = await getStatsUseCase.execute({ organizationId: orgId });
      expect(stats.find((s) => s.status === 'success')?.count).toBe(1);
      expect(stats.find((s) => s.status === 'failed')?.count).toBe(1);
    });
  });

  describe('ReplayWebhookDeliveryUseCase', () => {
    it('should replay a failed delivery with idempotency and replay tracking headers', async () => {
      const failedDelivery = WebhookDelivery.create({
        id: 'del-fail',
        webhookId: subscription.id,
        organizationId: orgId,
        deliveryId: 'orig-delivery-123',
        event: 'order.completed',
        requestUrl: subscription.url,
        requestPayload: { orderId: 'ord-888' },
      });
      failedDelivery.markFailure(503, 'Service Unavailable', 'HTTP_503', 500);
      await deliveryRepo.save(failedDelivery);

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { replayed: true },
      } as any);

      const replayResult = await replayUseCase.execute({
        deliveryId: 'orig-delivery-123',
        organizationId: orgId,
      });

      expect(replayResult.success).toBe(true);
      expect(replayResult.newDeliveryId).toBeDefined();
      expect(replayResult.newDeliveryId).not.toBe('orig-delivery-123');

      // Verify that replay delivery record was saved with replay metadata
      const replayedRecord = await deliveryRepo.findByDeliveryId({
        deliveryId: replayResult.newDeliveryId,
        organizationId: orgId,
      });
      expect(replayedRecord).toBeDefined();
      expect(replayedRecord?.isReplay).toBe(true);
      expect(replayedRecord?.originalDeliveryId).toBe('orig-delivery-123');
      expect(replayedRecord?.status).toBe('success');
    });

    it('should reject replaying an already successful delivery', async () => {
      const successDelivery = WebhookDelivery.create({
        id: 'del-success',
        webhookId: subscription.id,
        organizationId: orgId,
        deliveryId: 'success-del-777',
        event: 'order.completed',
        requestUrl: subscription.url,
        requestPayload: { orderId: 'ord-999' },
      });
      successDelivery.markSuccess(200, '{}', 80);
      await deliveryRepo.save(successDelivery);

      await expect(
        replayUseCase.execute({
          deliveryId: 'success-del-777',
          organizationId: orgId,
        })
      ).rejects.toThrow('Cannot replay a successful delivery');
    });
  });
});

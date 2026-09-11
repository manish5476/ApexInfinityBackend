import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { IWebhookDeliveryRepository } from '../../domain/ports/IWebhookDeliveryRepository';
import { WebhookDelivery } from '../../domain/entities/WebhookDelivery';
import { NotFoundError, ValidationError } from '../../../../shared/errors';

export class ReplayWebhookDeliveryUseCase {
  constructor(
    private readonly webhookRepo: IWebhookRepository,
    private readonly deliveryRepo: IWebhookDeliveryRepository
  ) {}

  async execute(params: { deliveryId: string; organizationId: string }): Promise<{ newDeliveryId: string; success: boolean }> {
    const delivery = await this.deliveryRepo.findByDeliveryId(params);
    if (!delivery) throw new NotFoundError('WebhookDelivery', params.deliveryId);

    if (delivery.status === 'success') {
      throw new ValidationError('Cannot replay a successful delivery');
    }

    const webhook = await this.webhookRepo.findById({ id: delivery.webhookId, organizationId: params.organizationId });
    if (!webhook) throw new NotFoundError('WebhookSubscription', delivery.webhookId);

    const newDeliveryId = uuidv4();
    const payload = delivery.requestPayload;

    const signature = crypto
      .createHmac('sha256', webhook.secret || 'no-secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Apex-Signature': `sha256=${signature}`,
      'X-Apex-Timestamp': String(Date.now()),
      'X-Apex-Delivery-Id': newDeliveryId,
      'X-Apex-Replay-Of': delivery.deliveryId,
    };

    const replayRecord = WebhookDelivery.create({
      id: uuidv4(),
      webhookId: webhook.id,
      organizationId: webhook.organizationId,
      deliveryId: newDeliveryId,
      event: delivery.event,
      isReplay: true,
      originalDeliveryId: delivery.deliveryId,
      requestUrl: webhook.url,
      requestPayload: payload,
      requestHeaders: headers,
    });

    const start = Date.now();
    try {
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 10000,
        validateStatus: null,
      });

      const responseTimeMs = Date.now() - start;
      const isSuccess = response.status >= 200 && response.status < 300;

      if (isSuccess) {
        replayRecord.markSuccess(response.status, JSON.stringify(response.data), responseTimeMs);
        webhook.recordSuccess();
      } else {
        replayRecord.markFailure(response.status, `HTTP error ${response.status}`, 'HTTP_ERROR', responseTimeMs);
        webhook.recordFailure();
      }

      await this.webhookRepo.save(webhook);
      await this.deliveryRepo.save(replayRecord);

      return { newDeliveryId, success: isSuccess };
    } catch (err: any) {
      const responseTimeMs = Date.now() - start;
      replayRecord.markFailure(undefined, err.message, err.code || 'NETWORK_ERROR', responseTimeMs);
      webhook.recordFailure();

      await this.webhookRepo.save(webhook);
      await this.deliveryRepo.save(replayRecord);

      return { newDeliveryId, success: false };
    }
  }
}

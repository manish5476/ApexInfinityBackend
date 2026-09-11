import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { IWebhookDeliveryRepository } from '../../domain/ports/IWebhookDeliveryRepository';
import { WebhookDelivery } from '../../domain/entities/WebhookDelivery';
import { NotFoundError } from '../../../../shared/errors';

export class TestWebhookUseCase {
  constructor(
    private readonly webhookRepo: IWebhookRepository,
    private readonly deliveryRepo?: IWebhookDeliveryRepository
  ) {}

  async execute(params: { id: string; organizationId: string }): Promise<{
    success: boolean;
    deliveryId: string;
    responseStatus?: number;
    responseTimeMs?: number;
    responseBody?: string;
  }> {
    const webhook = await this.webhookRepo.findById(params);
    if (!webhook) throw new NotFoundError('WebhookSubscription', params.id);

    const deliveryId = uuidv4();
    const payload = {
      id: deliveryId,
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test delivery from Apex' },
    };

    const signature = crypto
      .createHmac('sha256', webhook.secret || 'no-secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Apex-Signature': `sha256=${signature}`,
      'X-Apex-Timestamp': String(Date.now()),
      'X-Apex-Delivery-Id': deliveryId,
    };

    const delivery = WebhookDelivery.create({
      id: uuidv4(),
      webhookId: webhook.id,
      organizationId: webhook.organizationId,
      deliveryId,
      event: 'webhook.test',
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
        delivery.markSuccess(response.status, JSON.stringify(response.data), responseTimeMs);
        webhook.recordSuccess();
      } else {
        delivery.markFailure(response.status, `HTTP error ${response.status}`, 'HTTP_ERROR', responseTimeMs);
        webhook.recordFailure();
      }

      await this.webhookRepo.save(webhook);
      if (this.deliveryRepo) await this.deliveryRepo.save(delivery);

      return {
        success: isSuccess,
        deliveryId,
        responseStatus: response.status,
        responseTimeMs,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - start;
      delivery.markFailure(undefined, err.message, err.code || 'NETWORK_ERROR', responseTimeMs);
      webhook.recordFailure();

      await this.webhookRepo.save(webhook);
      if (this.deliveryRepo) await this.deliveryRepo.save(delivery);

      return {
        success: false,
        deliveryId,
        responseStatus: undefined,
        responseTimeMs,
        responseBody: err.message,
      };
    }
  }
}

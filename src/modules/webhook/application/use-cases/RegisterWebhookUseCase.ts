import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';
import { randomUUID } from 'crypto';

export interface RegisterWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export class RegisterWebhookUseCase {
  constructor(private readonly webhookRepo: IWebhookRepository) {}

  async execute(dto: RegisterWebhookDto, context: { organizationId: string }): Promise<WebhookSubscription> {
    const webhook = WebhookSubscription.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      ...dto,
    });

    await this.webhookRepo.save(webhook);
    return webhook;
  }
}

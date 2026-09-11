import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';
import { NotFoundError } from '../../../../shared/errors';

export class UpdateWebhookUseCase {
  constructor(private readonly repo: IWebhookRepository) {}

  async execute(
    params: {
      id: string;
      organizationId: string;
      name?: string;
      url?: string;
      events?: string[];
      secret?: string;
      isActive?: boolean;
    }
  ): Promise<WebhookSubscription> {
    const webhook = await this.repo.findById({ id: params.id, organizationId: params.organizationId });
    if (!webhook) throw new NotFoundError('WebhookSubscription', params.id);

    webhook.updateDetails({
      name: params.name,
      url: params.url,
      events: params.events,
      secret: params.secret,
      isActive: params.isActive,
    });

    await this.repo.save(webhook);
    return webhook;
  }
}

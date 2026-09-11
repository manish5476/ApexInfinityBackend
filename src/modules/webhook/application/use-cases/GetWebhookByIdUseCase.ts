import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';
import { NotFoundError } from '../../../../shared/errors';

export class GetWebhookByIdUseCase {
  constructor(private readonly repo: IWebhookRepository) {}

  async execute(params: { id: string; organizationId: string }): Promise<WebhookSubscription> {
    const webhook = await this.repo.findById(params);
    if (!webhook) throw new NotFoundError('WebhookSubscription', params.id);
    return webhook;
  }
}
